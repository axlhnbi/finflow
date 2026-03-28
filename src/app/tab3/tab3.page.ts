import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AlertController, IonModal } from '@ionic/angular';
import { ExpenseService, Wallet } from '../../services/expense.service';
import { TranslationService } from '../../services/translation.service';
import { UtilityService } from '../../services/utility.service';
import { Subscription, combineLatest, Observable } from 'rxjs';

@Component({ selector: 'app-tab3', templateUrl: 'tab3.page.html', styleUrls: ['tab3.page.scss'], standalone: false })
export class Tab3Page implements OnInit, OnDestroy {
  @ViewChild('walletModal') walletModal!: IonModal;
  @ViewChild('iconModal') iconModal!: IonModal;
  @ViewChild('walletNameInput') walletNameInput!: any;

  totalBalance: number = 0;
  walletSummaries: any[] = [];
  currency$!: Observable<string>;
  locale$!: Observable<string>;
  t: any = {};
  private dataSub!: Subscription;

  editingWalletId: string | null = null; walletName: string = ''; walletIcon: string = 'wallet'; walletColor: string = 'primary-box';
  availableIcons: string[] = ['wallet', 'cash', 'card', 'briefcase', 'business', 'calculator', 'cart', 'basket', 'bag', 'gift', 'home', 'car', 'bus', 'airplane', 'bicycle', 'cafe'];
  availableColors: string[] = ['primary-box', 'success-box', 'warning-box', 'danger-box', 'tertiary-box', 'medium-box'];

  constructor(
    private expenseService: ExpenseService,
    private translationService: TranslationService,
    private utility: UtilityService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.currency$ = this.expenseService.currency$;
    this.locale$ = this.expenseService.locale$;
    this.translationService.translations$.subscribe(dict => this.t = dict);
    this.dataSub = combineLatest([this.expenseService.wallets$, this.expenseService.transactions$]).subscribe(([wallets, transactions]) => {
      const summaries = wallets.map(w => ({ ...w, balance: 0 })); let total = 0;
      transactions.forEach(trx => {
        const sourceWallet = summaries.find(w => w.id === trx.wallet); const destWallet = trx.toWallet ? summaries.find(w => w.id === trx.toWallet) : null;
        if (trx.type === 'income') { if (sourceWallet) sourceWallet.balance += trx.amount; total += trx.amount; }
        else if (trx.type === 'expense') { if (sourceWallet) sourceWallet.balance -= trx.amount; total -= trx.amount; }
        else if (trx.type === 'transfer') { if (sourceWallet) sourceWallet.balance -= trx.amount; if (destWallet) destWallet.balance += trx.amount; }
      });
      this.walletSummaries = summaries; this.totalBalance = total;
    });
  }
  ngOnDestroy() { if (this.dataSub) this.dataSub.unsubscribe(); }
  handleRefresh(event: any) { setTimeout(() => { event.target.complete(); }, 1500); }

  focusWalletNameInput() {
    if (this.walletNameInput) {
      setTimeout(() => {
        this.walletNameInput.setFocus();
      }, 150);
    }
  }

  openAddWallet() { this.editingWalletId = null; this.walletName = ''; this.walletIcon = 'wallet'; this.walletColor = 'primary-box'; this.walletModal.present(); }
  editWallet(wallet: any) { this.editingWalletId = wallet.id; this.walletName = wallet.name; this.walletIcon = wallet.icon; this.walletColor = wallet.colorClass; this.walletModal.present(); }
  
  async deleteWallet(id: string) {
    const alert = await this.alertController.create({
      header: this.t.DELETE,
      message: this.translationService.getCurrentLang() === 'id' ? 'Hapus dompet ini?' : 'Delete this wallet?',
      buttons: [ { text: this.t.CANCEL, role: 'cancel' }, { text: this.t.DELETE, role: 'destructive', handler: () => { this.expenseService.deleteWallet(id); } } ]
    });
    await alert.present();
  }
  
  dismissWalletModal() { this.walletModal.dismiss(); }
  openIconPicker() { this.iconModal.present(); }
  selectIcon(icon: string) { this.walletIcon = icon; this.iconModal.dismiss(); }
  selectColor(c: string) { this.walletColor = c; }
  
  saveWallet() {
    const lang = this.translationService.getCurrentLang();
    if (!this.walletName.trim()) {
      this.utility.showToast(lang === 'id' ? 'Nama dompet wajib diisi!' : 'Wallet name is required!', 'danger');
      return;
    }
    const w: Wallet = { id: this.editingWalletId || Date.now().toString(), name: this.walletName, icon: this.walletIcon, colorClass: this.walletColor };
    if (this.editingWalletId) this.expenseService.updateWallet(w); else this.expenseService.addWallet(w);
    this.dismissWalletModal();
  }
}