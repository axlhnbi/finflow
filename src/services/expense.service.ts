import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';

export interface UserProfile { name: string; email: string; greeting: string; avatarUrl: string; }
export interface Wallet { id: string; name: string; icon: string; colorClass: string; }
export interface Category { id: string; name: string; icon: string; colorClass: string; budget: number; type: 'income' | 'expense'; }
export interface Transaction { id: string; title: string; type: string; amount: number; category?: string; categoryName?: string; categoryIcon?: string; wallet: string; walletName: string; walletIcon: string; toWallet?: string; toWalletName?: string; toWalletIcon?: string; date: string; notes: string; }

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private _storage: Storage | null = null;
  private defaultUser: UserProfile = { name: 'Bos', email: 'bos@email.com', greeting: 'Siap kelola uangmu?', avatarUrl: 'https://ionicframework.com/docs/img/demos/avatar.svg' };
  private defaultWallets: Wallet[] = [ { id: 'tunai', name: 'Tunai', icon: 'cash', colorClass: 'success-box' }, { id: 'mandiri', name: 'Bank Mandiri', icon: 'card', colorClass: 'primary-box' }, { id: 'gopay', name: 'GoPay', icon: 'wallet', colorClass: 'tertiary-box' } ];
  private defaultCategories: Category[] = [ { id: 'gaji', name: 'Gaji', icon: 'cash', colorClass: 'success-box', budget: 0, type: 'income' }, { id: 'makanan', name: 'Makanan', icon: 'fast-food', colorClass: 'warning-box', budget: 0, type: 'expense' }, { id: 'transport', name: 'Transport', icon: 'bus', colorClass: 'tertiary-box', budget: 0, type: 'expense' } ];

  private userProfile = new BehaviorSubject<UserProfile>(this.defaultUser);
  userProfile$ = this.userProfile.asObservable();
  private wallets = new BehaviorSubject<Wallet[]>(this.defaultWallets);
  wallets$ = this.wallets.asObservable();
  private categories = new BehaviorSubject<Category[]>(this.defaultCategories);
  categories$ = this.categories.asObservable();
  private transactions = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactions.asObservable();

  private currency = new BehaviorSubject<string>(localStorage.getItem('currency') || 'IDR');
  currency$ = this.currency.asObservable();
  
  locale$: Observable<string> = this.currency$.pipe(map(c => c === 'IDR' ? 'id-ID' : 'en-US'));

  constructor(private storage: Storage) { this.initDatabase(); }

  async initDatabase() {
    const storage = await this.storage.create();
    this._storage = storage;
    await this.loadDataFromStorage();
  }

  private async loadDataFromStorage() {
    const storedUser = await this._storage?.get('userProfile'); if (storedUser) this.userProfile.next(storedUser);
    const storedWallets = await this._storage?.get('wallets'); if (storedWallets) this.wallets.next(storedWallets);
    const storedCategories = await this._storage?.get('categories'); if (storedCategories) this.categories.next(storedCategories);
    const storedTransactions = await this._storage?.get('transactions'); if (storedTransactions) this.transactions.next(storedTransactions);
  }

  private saveDataToStorage(key: string, data: any) { if (this._storage) this._storage.set(key, data); }

  updateCurrency(code: string) { localStorage.setItem('currency', code); this.currency.next(code); }
  updateUserProfile(profile: UserProfile) { this.userProfile.next(profile); this.saveDataToStorage('userProfile', profile); }
  
  resetData() {
    this.transactions.next([]); this.wallets.next([...this.defaultWallets]); this.categories.next([...this.defaultCategories]);
    this.saveDataToStorage('transactions', []); this.saveDataToStorage('wallets', [...this.defaultWallets]); this.saveDataToStorage('categories', [...this.defaultCategories]);
  }

  addCategory(category: Category) { const updated = [...this.categories.getValue(), category]; this.categories.next(updated); this.saveDataToStorage('categories', updated); }
  updateCategory(updatedCategory: Category) {
    const current = this.categories.getValue(); const index = current.findIndex(c => c.id === updatedCategory.id);
    if (index > -1) {
      current[index] = updatedCategory; this.categories.next([...current]); this.saveDataToStorage('categories', current);
      const currentTrx = this.transactions.getValue(); let hasChanges = false;
      currentTrx.forEach(trx => { if (trx.category === updatedCategory.id) { trx.categoryName = updatedCategory.name; trx.categoryIcon = updatedCategory.icon; hasChanges = true; } });
      if (hasChanges) { this.transactions.next([...currentTrx]); this.saveDataToStorage('transactions', currentTrx); }
    }
  }
  deleteCategory(id: string) { const updated = this.categories.getValue().filter(c => c.id !== id); this.categories.next(updated); this.saveDataToStorage('categories', updated); }

  addWallet(wallet: Wallet) { const updated = [...this.wallets.getValue(), wallet]; this.wallets.next(updated); this.saveDataToStorage('wallets', updated); }
  updateWallet(updatedWallet: Wallet) {
    const current = this.wallets.getValue(); const index = current.findIndex(w => w.id === updatedWallet.id);
    if (index > -1) {
      current[index] = updatedWallet; this.wallets.next([...current]); this.saveDataToStorage('wallets', current);
      const currentTrx = this.transactions.getValue(); let hasChanges = false;
      currentTrx.forEach(trx => {
        if (trx.wallet === updatedWallet.id) { trx.walletName = updatedWallet.name; trx.walletIcon = updatedWallet.icon; hasChanges = true; }
        if (trx.toWallet === updatedWallet.id) { trx.toWalletName = updatedWallet.name; trx.toWalletIcon = updatedWallet.icon; hasChanges = true; }
      });
      if (hasChanges) { this.transactions.next([...currentTrx]); this.saveDataToStorage('transactions', currentTrx); }
    }
  }
  deleteWallet(id: string) { const updated = this.wallets.getValue().filter(w => w.id !== id); this.wallets.next(updated); this.saveDataToStorage('wallets', updated); }

  addTransaction(trx: Transaction) { const updated = [trx, ...this.transactions.getValue()]; this.transactions.next(updated); this.saveDataToStorage('transactions', updated); }
  updateTransaction(updatedTrx: Transaction) {
    const current = this.transactions.getValue(); const index = current.findIndex(t => t.id === updatedTrx.id);
    if (index > -1) { current[index] = updatedTrx; this.transactions.next([...current]); this.saveDataToStorage('transactions', current); }
  }
  deleteTransaction(id: string) { const updated = this.transactions.getValue().filter(t => t.id !== id); this.transactions.next(updated); this.saveDataToStorage('transactions', updated); }
}