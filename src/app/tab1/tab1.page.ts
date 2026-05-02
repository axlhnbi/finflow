import { Component, ViewChild, OnInit } from '@angular/core';
import { IonModal, AlertController, ActionSheetController } from '@ionic/angular';
import { ExpenseService, Transaction, UserProfile, Wallet, Category } from '../../services/expense.service';
import { UtilityService } from '../../services/utility.service';
import { TranslationService } from '../../services/translation.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  @ViewChild('mainModal') mainModal!: IonModal;
  @ViewChild('categoryModal') categoryModal!: IonModal;
  @ViewChild('walletModal') walletModal!: IonModal;
  @ViewChild('toWalletModal') toWalletModal!: IonModal;
  @ViewChild('inlineCategoryModal') inlineCategoryModal!: IonModal;
  @ViewChild('inlineWalletModal') inlineWalletModal!: IonModal;
  @ViewChild('iconModal') iconModal!: IonModal;
  @ViewChild('trxOptionsModal') trxOptionsModal!: IonModal;
  @ViewChild('titleInput') titleInput!: any;
  @ViewChild('inlineCatInput') inlineCatInput!: any;
  @ViewChild('inlineWalletInput') inlineWalletInput!: any;

  userProfile$!: Observable<UserProfile>;
  wallets$!: Observable<Wallet[]>;
  currency$!: Observable<string>;
  locale$!: Observable<string>;
  t: any = {};
  allCategories: Category[] = [];
  allWallets: Wallet[] = [];
  filterDate$ = new BehaviorSubject<Date>(new Date());
  filteredTransactions$!: Observable<Transaction[]>;

  selectedTrx: Transaction | null = null;
  editingTransactionId: string | null = null;
  transactionType: string = 'expense';
  title: string = '';
  amount: number | null = null;
  displayAmount: string = '';
  date: string = new Date().toISOString();
  notes: string = '';
  
  category: string = ''; categoryName: string = ''; categoryIcon: string = 'grid-outline'; categoryColor: string = 'medium-box';
  wallet: string = ''; walletName: string = ''; walletIcon: string = 'wallet-outline'; walletColor: string = 'medium-box';
  toWallet: string = ''; toWalletName: string = ''; toWalletIcon: string = 'wallet-outline'; toWalletColor: string = 'medium-box';

  inlineCatName: string = ''; inlineCatIcon: string = 'grid'; inlineCatColor: string = 'primary-box';
  inlineWalletName: string = ''; inlineWalletIcon: string = 'wallet'; inlineWalletColor: string = 'primary-box';

  activeIconPicker: 'category' | 'wallet' = 'category';
  activeWalletPicker: 'from' | 'to' = 'from';
  
  availableIcons: string[] = ['grid', 'fast-food', 'bus', 'game-controller', 'cart', 'home', 'medkit', 'book', 'airplane', 'cafe', 'barbell', 'bag', 'cash', 'wallet', 'card', 'business'];
  availableColors: string[] = ['primary-box', 'success-box', 'warning-box', 'danger-box', 'tertiary-box', 'medium-box'];

  constructor(
    private expenseService: ExpenseService,
    private utility: UtilityService,
    private translationService: TranslationService,
    private alertController: AlertController,
    private actionSheetCtrl: ActionSheetController
  ) {}

  ngOnInit() {
    this.userProfile$ = this.expenseService.userProfile$;
    this.wallets$ = this.expenseService.wallets$;
    this.currency$ = this.expenseService.currency$;
    this.locale$ = this.expenseService.locale$;
   
    this.translationService.translations$.subscribe(dict => this.t = dict);
    this.expenseService.categories$.subscribe(cats => this.allCategories = cats);
    this.expenseService.wallets$.subscribe(w => this.allWallets = w);

    this.filteredTransactions$ = combineLatest([this.expenseService.transactions$, this.filterDate$]).pipe(
      map(([transactions, filterDate]) => {
        return transactions.filter(trx => {
          const trxDate = new Date(trx.date);
          return trxDate.getDate() === filterDate.getDate() && trxDate.getMonth() === filterDate.getMonth() && trxDate.getFullYear() === filterDate.getFullYear();
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      })
    );
  }

  get availableCategories() { return this.allCategories.filter(c => c.type === this.transactionType); }

  handleRefresh(event: any) { setTimeout(() => { event.target.complete(); }, 1500); }
  prevDay() { const current = this.filterDate$.getValue(); const prev = new Date(current); prev.setDate(prev.getDate() - 1); this.filterDate$.next(prev); }
  nextDay() { const current = this.filterDate$.getValue(); const next = new Date(current); next.setDate(next.getDate() + 1); this.filterDate$.next(next); }
  onFilterDateChange(event: any) { if (event.detail.value) this.filterDate$.next(new Date(event.detail.value)); }
  onTransactionTypeChange() { this.category = ''; this.categoryName = ''; this.categoryIcon = 'grid-outline'; this.categoryColor = 'medium-box'; }

  async safeDismiss(modal: any) {
    if (modal) {
      try { await modal.dismiss(); } catch (e) {}
    }
  }

  async safePresent(modal: any) {
    if (modal) {
      try { await modal.present(); } catch (e) {}
    }
  }

  async openAddModal() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.t.ADD_TRX || 'Tambah Transaksi',
      buttons: [
        {
          text: this.t.EXPENSE || 'Pengeluaran',
          icon: 'arrow-down-circle-outline',
          handler: () => { this.startNewTransaction('expense'); }
        },
        {
          text: this.t.INCOME || 'Pemasukan',
          icon: 'arrow-up-circle-outline',
          handler: () => { this.startNewTransaction('income'); }
        },
        {
          text: this.t.TRANSFER || 'Pindah Saldo',
          icon: 'swap-horizontal-outline',
          handler: () => { this.startNewTransaction('transfer'); }
        },
        {
          text: this.t.CANCEL || 'Batal',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async startNewTransaction(type: string) {
    this.resetForm(type);
    await this.safePresent(this.mainModal);
  }

  focusTitleInput() {
    if (this.titleInput) {
      setTimeout(() => {
        this.titleInput.setFocus();
      }, 150);
    }
  }

  focusInlineCatInput() {
    if (this.inlineCatInput) {
      setTimeout(() => {
        this.inlineCatInput.setFocus();
      }, 150);
    }
  }

  focusInlineWalletInput() {
    if (this.inlineWalletInput) {
      setTimeout(() => {
        this.inlineWalletInput.setFocus();
      }, 150);
    }
  }

  async openTransactionOptions(trx: Transaction) { 
    this.selectedTrx = trx; 
    await this.safePresent(this.trxOptionsModal); 
  }
  
  async closeTransactionOptions() { 
    await this.safeDismiss(this.trxOptionsModal); 
  }
  
  async editSelectedTransaction() { 
    if (this.selectedTrx) { 
      await this.closeTransactionOptions(); 
      setTimeout(() => { this.editTransaction(this.selectedTrx!); }, 300); 
    } 
  }

  async deleteSelectedTransaction() {
    if (this.selectedTrx) {
      const id = this.selectedTrx.id;
      await this.closeTransactionOptions();
      const alert = await this.alertController.create({
        header: this.t.DELETE, message: this.t.DEL_TRX_MSG, mode: 'ios',
        buttons: [ { text: this.t.CANCEL, role: 'cancel' }, { text: this.t.DELETE, role: 'destructive', handler: () => { this.expenseService.deleteTransaction(id); } } ]
      });
      await alert.present();
    }
  }

  onAmountChange(event: any) {
    let rawValue = event.target.value.replace(/[^0-9]/g, '');
    if (!rawValue) {
      this.amount = null; this.displayAmount = ''; return;
    }
    this.amount = parseInt(rawValue, 10);
    this.locale$.pipe(take(1)).subscribe(loc => {
      this.displayAmount = this.amount!.toLocaleString(loc);
    });
  }

  async editTransaction(trx: Transaction) {
    this.editingTransactionId = trx.id; this.transactionType = trx.type; this.title = trx.title;
    this.amount = trx.amount;
    this.locale$.pipe(take(1)).subscribe(loc => { this.displayAmount = trx.amount.toLocaleString(loc); });
    this.date = trx.date; this.notes = trx.notes;
    
    this.wallet = trx.wallet; this.walletName = trx.walletName; this.walletIcon = trx.walletIcon;
    this.walletColor = this.allWallets.find(w => w.id === trx.wallet)?.colorClass || 'medium-box';

    if (trx.type === 'transfer') {
      this.toWallet = trx.toWallet || ''; this.toWalletName = trx.toWalletName || ''; this.toWalletIcon = trx.toWalletIcon || 'wallet-outline';
      this.toWalletColor = this.allWallets.find(w => w.id === trx.toWallet)?.colorClass || 'medium-box';
      this.category = ''; this.categoryName = ''; this.categoryIcon = 'grid-outline'; this.categoryColor = 'medium-box';
    } else {
      this.category = trx.category || ''; this.categoryName = trx.categoryName || ''; this.categoryIcon = trx.categoryIcon || 'grid-outline';
      this.categoryColor = this.allCategories.find(c => c.id === trx.category)?.colorClass || 'medium-box';
      this.toWallet = ''; this.toWalletName = ''; this.toWalletIcon = 'wallet-outline'; this.toWalletColor = 'medium-box';
    }
    await this.safePresent(this.mainModal);
  }

  async dismissModal() { 
    await this.safeDismiss(this.mainModal); 
  }
  
  async openCategory() { await this.safePresent(this.categoryModal); }
  async openWallet() { this.activeWalletPicker = 'from'; await this.safePresent(this.walletModal); }
  async openToWallet() { this.activeWalletPicker = 'to'; await this.safePresent(this.toWalletModal); }

  async setCategory(val: string, name: string, icon: string, color: string) { 
    this.category = val; 
    this.categoryName = name; 
    this.categoryIcon = icon; 
    this.categoryColor = color; 
    await this.safeDismiss(this.categoryModal); 
  }
  
  async setWallet(val: string, name: string, icon: string, color: string) { 
    this.wallet = val; 
    this.walletName = name; 
    this.walletIcon = icon; 
    this.walletColor = color; 
    await this.safeDismiss(this.walletModal); 
  }
  
  async setToWallet(val: string, name: string, icon: string, color: string) { 
    this.toWallet = val; 
    this.toWalletName = name; 
    this.toWalletIcon = icon; 
    this.toWalletColor = color; 
    await this.safeDismiss(this.toWalletModal); 
  }

  async openInlineCategoryForm(modalRef?: IonModal) { 
    await this.safeDismiss(this.categoryModal); 
    this.inlineCatName = ''; 
    this.inlineCatIcon = 'grid'; 
    this.inlineCatColor = 'primary-box'; 
    await this.safePresent(modalRef || this.inlineCategoryModal); 
  }
  
  async saveInlineCategory() {
    const lang = this.translationService.getCurrentLang();
    if (!this.inlineCatName.trim()) {
      this.utility.showToast(lang === 'id' ? 'Nama kategori wajib diisi!' : 'Category name is required!', 'danger');
      return;
    }
    const newCat: Category = { id: Date.now().toString(), name: this.inlineCatName, icon: this.inlineCatIcon, colorClass: this.inlineCatColor, budget: 0, type: this.transactionType as 'income' | 'expense' };
    this.expenseService.addCategory(newCat); 
    
    this.category = newCat.id;
    this.categoryName = newCat.name;
    this.categoryIcon = newCat.icon;
    this.categoryColor = newCat.colorClass;
    
    await this.safeDismiss(this.inlineCategoryModal);
  }

  async openInlineWalletForm(modalRef?: IonModal) { 
    if (this.activeWalletPicker === 'to') {
      await this.safeDismiss(this.toWalletModal);
    } else {
      await this.safeDismiss(this.walletModal); 
    }
    this.inlineWalletName = ''; 
    this.inlineWalletIcon = 'wallet'; 
    this.inlineWalletColor = 'primary-box'; 
    await this.safePresent(modalRef || this.inlineWalletModal); 
  }
  
  async saveInlineWallet() {
    const lang = this.translationService.getCurrentLang();
    if (!this.inlineWalletName.trim()) {
      this.utility.showToast(lang === 'id' ? 'Nama dompet wajib diisi!' : 'Wallet name is required!', 'danger');
      return;
    }
    const newWallet: Wallet = { id: Date.now().toString(), name: this.inlineWalletName, icon: this.inlineWalletIcon, colorClass: this.inlineWalletColor };
    this.expenseService.addWallet(newWallet); 
    
    if (this.activeWalletPicker === 'to') {
      this.toWallet = newWallet.id;
      this.toWalletName = newWallet.name;
      this.toWalletIcon = newWallet.icon;
      this.toWalletColor = newWallet.colorClass;
    } else {
      this.wallet = newWallet.id;
      this.walletName = newWallet.name;
      this.walletIcon = newWallet.icon;
      this.walletColor = newWallet.colorClass;
    }
    
    await this.safeDismiss(this.inlineWalletModal);
  }

  async openIconPicker(target: 'category' | 'wallet', modalRef?: IonModal) { 
    this.activeIconPicker = target; 
    await this.safePresent(modalRef || this.iconModal); 
  }
  
  async selectIcon(icon: string) { 
    if (this.activeIconPicker === 'category') this.inlineCatIcon = icon; 
    else this.inlineWalletIcon = icon; 
    await this.safeDismiss(this.iconModal); 
  }
  
  selectColor(color: string, target: 'category' | 'wallet') { 
    if (target === 'category') this.inlineCatColor = color; 
    else this.inlineWalletColor = color; 
  }

  async saveTransaction() {
    const lang = this.translationService.getCurrentLang();

    if (!this.title.trim() || !this.amount || !this.wallet) {
      this.utility.showToast(lang === 'id' ? 'Mohon isi judul, nominal, dan dompet asal!' : 'Please fill in title, amount, and source wallet!', 'danger');
      return;
    }

    if (this.transactionType !== 'transfer' && !this.category) {
      this.utility.showToast(lang === 'id' ? 'Mohon pilih kategori!' : 'Please select a category!', 'danger');
      return;
    }

    if (this.transactionType === 'transfer' && (!this.toWallet || this.wallet === this.toWallet)) {
      this.utility.showToast(lang === 'id' ? 'Mohon pilih dompet tujuan yang berbeda!' : 'Please select a different destination wallet!', 'danger');
      return;
    }

    const transactionData: Transaction = { id: this.editingTransactionId || Date.now().toString(), title: this.title.trim(), type: this.transactionType, amount: this.amount, wallet: this.wallet, walletName: this.walletName, walletIcon: this.walletIcon, date: this.date, notes: this.notes };
    if (this.transactionType === 'transfer') { transactionData.toWallet = this.toWallet; transactionData.toWalletName = this.toWalletName; transactionData.toWalletIcon = this.toWalletIcon; }
    else { transactionData.category = this.category; transactionData.categoryName = this.categoryName; transactionData.categoryIcon = this.categoryIcon; }
   
    if (this.editingTransactionId) this.expenseService.updateTransaction(transactionData);
    else this.expenseService.addTransaction(transactionData);
   
    await this.safeDismiss(this.mainModal); 
    this.resetForm(this.transactionType);
  }

  resetForm(type: string = 'expense') {
    this.editingTransactionId = null;
    this.transactionType = type;
    this.title = '';
    this.amount = null;
    this.displayAmount = '';
   
    const now = new Date();
    const currentFilterDate = new Date(this.filterDate$.getValue());
    currentFilterDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
   
    const tzOffset = currentFilterDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(currentFilterDate.getTime() - tzOffset)).toISOString().slice(0, -1);
    this.date = localISOTime;

    this.notes = '';
    this.category = '';
    this.categoryName = '';
    this.categoryIcon = 'grid-outline';
    this.categoryColor = 'medium-box';
    this.wallet = '';
    this.walletName = '';
    this.walletIcon = 'wallet-outline';
    this.walletColor = 'medium-box';
    this.toWallet = '';
    this.toWalletName = '';
    this.toWalletIcon = 'wallet-outline';
    this.toWalletColor = 'medium-box';
  }
}