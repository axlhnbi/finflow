import { Component, ViewChild, OnInit } from '@angular/core';
import { IonModal, AlertController } from '@ionic/angular';
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
  
  userProfile$!: Observable<UserProfile>;
  wallets$!: Observable<Wallet[]>;
  currency$!: Observable<string>;
  locale$!: Observable<string>;
  
  t: any = {};
  allCategories: Category[] = [];
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
  category: string = ''; categoryName: string = ''; categoryIcon: string = 'grid-outline';
  wallet: string = ''; walletName: string = ''; walletIcon: string = 'wallet-outline';
  toWallet: string = ''; toWalletName: string = ''; toWalletIcon: string = 'wallet-outline';

  inlineCatName: string = ''; inlineCatIcon: string = 'grid'; inlineCatColor: string = 'primary-box';
  inlineWalletName: string = ''; inlineWalletIcon: string = 'wallet'; inlineWalletColor: string = 'primary-box';

  activeIconPicker: 'category' | 'wallet' = 'category';
  availableIcons: string[] = ['grid', 'fast-food', 'bus', 'game-controller', 'cart', 'home', 'medkit', 'book', 'airplane', 'cafe', 'barbell', 'bag', 'cash', 'wallet', 'card', 'business'];
  availableColors: string[] = ['primary-box', 'success-box', 'warning-box', 'danger-box', 'tertiary-box', 'medium-box'];

  constructor(
    private expenseService: ExpenseService,
    private utility: UtilityService,
    private translationService: TranslationService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.userProfile$ = this.expenseService.userProfile$;
    this.wallets$ = this.expenseService.wallets$;
    this.currency$ = this.expenseService.currency$;
    this.locale$ = this.expenseService.locale$;
    
    this.translationService.translations$.subscribe(dict => this.t = dict);
    this.expenseService.categories$.subscribe(cats => this.allCategories = cats);

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
  onTransactionTypeChange() { this.category = ''; this.categoryName = ''; this.categoryIcon = 'grid-outline'; }
  openAddModal() { this.resetForm(); this.mainModal.present(); }
  openTransactionOptions(trx: Transaction) { this.selectedTrx = trx; this.trxOptionsModal.present(); }
  closeTransactionOptions() { this.trxOptionsModal.dismiss(); }
  editSelectedTransaction() { if (this.selectedTrx) { this.closeTransactionOptions(); setTimeout(() => { this.editTransaction(this.selectedTrx!); }, 300); } }

  async deleteSelectedTransaction() {
    if (this.selectedTrx) {
      const id = this.selectedTrx.id;
      this.closeTransactionOptions();
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

  editTransaction(trx: Transaction) {
    this.editingTransactionId = trx.id; this.transactionType = trx.type; this.title = trx.title;
    this.amount = trx.amount;
    this.locale$.pipe(take(1)).subscribe(loc => { this.displayAmount = trx.amount.toLocaleString(loc); });
    this.date = trx.date; this.notes = trx.notes;
    this.wallet = trx.wallet; this.walletName = trx.walletName; this.walletIcon = trx.walletIcon;
    if (trx.type === 'transfer') {
      this.toWallet = trx.toWallet || ''; this.toWalletName = trx.toWalletName || ''; this.toWalletIcon = trx.toWalletIcon || 'wallet-outline';
      this.category = ''; this.categoryName = ''; this.categoryIcon = 'grid-outline';
    } else {
      this.category = trx.category || ''; this.categoryName = trx.categoryName || ''; this.categoryIcon = trx.categoryIcon || 'grid-outline';
      this.toWallet = ''; this.toWalletName = ''; this.toWalletIcon = 'wallet-outline';
    }
    this.mainModal.present();
  }

  dismissModal() { this.mainModal.dismiss(); }
  openCategory() { this.categoryModal.present(); }
  openWallet() { this.walletModal.present(); }
  openToWallet() { this.toWalletModal.present(); }

  setCategory(val: string, name: string, icon: string) { this.category = val; this.categoryName = name; this.categoryIcon = icon; this.categoryModal.dismiss(); }
  setWallet(val: string, name: string, icon: string) { this.wallet = val; this.walletName = name; this.walletIcon = icon; this.walletModal.dismiss(); }
  setToWallet(val: string, name: string, icon: string) { this.toWallet = val; this.toWalletName = name; this.toWalletIcon = icon; this.toWalletModal.dismiss(); }

  openInlineCategoryForm() { this.categoryModal.dismiss(); this.inlineCatName = ''; this.inlineCatIcon = 'grid'; this.inlineCatColor = 'primary-box'; this.inlineCategoryModal.present(); }
  
  saveInlineCategory() {
    const lang = this.translationService.getCurrentLang();
    if (!this.inlineCatName.trim()) {
      this.utility.showToast(lang === 'id' ? 'Nama kategori wajib diisi!' : 'Category name is required!', 'danger');
      return;
    }
    const newCat: Category = { id: Date.now().toString(), name: this.inlineCatName, icon: this.inlineCatIcon, colorClass: this.inlineCatColor, budget: 0, type: this.transactionType as 'income' | 'expense' };
    this.expenseService.addCategory(newCat); this.setCategory(newCat.id, newCat.name, newCat.icon); this.inlineCategoryModal.dismiss();
  }

  openInlineWalletForm() { this.walletModal.dismiss(); this.toWalletModal.dismiss(); this.inlineWalletName = ''; this.inlineWalletIcon = 'wallet'; this.inlineWalletColor = 'primary-box'; this.inlineWalletModal.present(); }
  
  saveInlineWallet() {
    const lang = this.translationService.getCurrentLang();
    if (!this.inlineWalletName.trim()) {
      this.utility.showToast(lang === 'id' ? 'Nama rekening wajib diisi!' : 'Wallet name is required!', 'danger');
      return;
    }
    const newWallet: Wallet = { id: Date.now().toString(), name: this.inlineWalletName, icon: this.inlineWalletIcon, colorClass: this.inlineWalletColor };
    this.expenseService.addWallet(newWallet); this.inlineWalletModal.dismiss();
  }

  openIconPicker(target: 'category' | 'wallet') { this.activeIconPicker = target; this.iconModal.present(); }
  selectIcon(icon: string) { if (this.activeIconPicker === 'category') this.inlineCatIcon = icon; else this.inlineWalletIcon = icon; this.iconModal.dismiss(); }
  selectColor(color: string, target: 'category' | 'wallet') { if (target === 'category') this.inlineCatColor = color; else this.inlineWalletColor = color; }

  saveTransaction() {
    const lang = this.translationService.getCurrentLang();

    if (!this.title.trim() || !this.amount || !this.wallet) {
      this.utility.showToast(lang === 'id' ? 'Mohon isi judul, nominal, dan rekening asal!' : 'Please fill in title, amount, and source wallet!', 'danger');
      return;
    }

    if (this.transactionType !== 'transfer' && !this.category) {
      this.utility.showToast(lang === 'id' ? 'Mohon pilih kategori!' : 'Please select a category!', 'danger');
      return;
    }

    if (this.transactionType === 'transfer' && (!this.toWallet || this.wallet === this.toWallet)) {
      this.utility.showToast(lang === 'id' ? 'Mohon pilih rekening tujuan yang berbeda!' : 'Please select a different destination wallet!', 'danger');
      return;
    }

    const transactionData: Transaction = { id: this.editingTransactionId || Date.now().toString(), title: this.title.trim(), type: this.transactionType, amount: this.amount, wallet: this.wallet, walletName: this.walletName, walletIcon: this.walletIcon, date: this.date, notes: this.notes };
    if (this.transactionType === 'transfer') { transactionData.toWallet = this.toWallet; transactionData.toWalletName = this.toWalletName; transactionData.toWalletIcon = this.toWalletIcon; }
    else { transactionData.category = this.category; transactionData.categoryName = this.categoryName; transactionData.categoryIcon = this.categoryIcon; }
    
    if (this.editingTransactionId) this.expenseService.updateTransaction(transactionData);
    else this.expenseService.addTransaction(transactionData);
    
    this.dismissModal(); this.resetForm();
  }

  resetForm() {
    this.editingTransactionId = null; 
    this.transactionType = 'expense'; 
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
    this.wallet = ''; 
    this.walletName = ''; 
    this.walletIcon = 'wallet-outline'; 
    this.toWallet = ''; 
    this.toWalletName = ''; 
    this.toWalletIcon = 'wallet-outline';
  }
}