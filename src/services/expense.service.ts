import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

export interface UserProfile { name: string; email: string; greeting: string; avatarUrl: string; }
export interface Wallet { id: string; name: string; icon: string; colorClass: string; is_deleted?: boolean; }
export interface Category { id: string; name: string; icon: string; colorClass: string; budget: number; type: 'income' | 'expense'; is_deleted?: boolean; }
export interface Transaction { id: string; title: string; type: string; amount: number; category?: string; categoryName?: string; categoryIcon?: string; wallet: string; walletName: string; walletIcon: string; toWallet?: string; toWalletName?: string; toWalletIcon?: string; date: string; notes: string; is_deleted?: boolean; }

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private _storage: Storage | null = null;
  get currentUserId(): string { return localStorage.getItem('user_id') || ''; }

  private rawWallets: Wallet[] = [];
  private rawCategories: Category[] = [];
  private rawTransactions: Transaction[] = [];

  private userProfile = new BehaviorSubject<UserProfile>({ name: '', email: '', greeting: '', avatarUrl: '' });
  userProfile$ = this.userProfile.asObservable();
  private wallets = new BehaviorSubject<Wallet[]>([]);
  wallets$ = this.wallets.asObservable();
  private categories = new BehaviorSubject<Category[]>([]);
  categories$ = this.categories.asObservable();
  private transactions = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactions.asObservable();

  private currency = new BehaviorSubject<string>(localStorage.getItem('currency') || 'IDR');
  currency$ = this.currency.asObservable();
  locale$: Observable<string> = this.currency$.pipe(map(c => c === 'IDR' ? 'id-ID' : 'en-US'));

  constructor(private storage: Storage, private http: HttpClient) {
    this.initDatabase();
  }

  async initDatabase() {
    const storage = await this.storage.create();
    this._storage = storage;
    if (this.currentUserId) {
      await this.loadDataFromStorage();
      
      const isFreshLogin = !localStorage.getItem('last_sync_' + this.currentUserId);
      
      if (isFreshLogin) {
        await this.syncWithServer();
        this.injectDefaultsIfEmpty();
      } else {
        this.injectDefaultsIfEmpty();
        this.syncWithServer();
      }
    }
  }

  async loadDataFromStorage() {
    const storedUser = await this._storage?.get('userProfile_' + this.currentUserId);
    if (storedUser) {
      if (!storedUser.avatarUrl || storedUser.avatarUrl.trim() === '') {
        storedUser.avatarUrl = 'assets/nopic.svg';
      }
      this.userProfile.next(storedUser);
    } else {
      this.userProfile.next({
        name: localStorage.getItem('user_name') || 'User',
        email: localStorage.getItem('user_email') || '',
        greeting: 'Siap kelola uangmu?',
        avatarUrl: localStorage.getItem('user_avatar') || 'assets/nopic.svg'
      });
    }
   
    this.rawWallets = await this._storage?.get('wallets_' + this.currentUserId) || [];
    this.rawCategories = await this._storage?.get('categories_' + this.currentUserId) || [];
    this.rawTransactions = await this._storage?.get('transactions_' + this.currentUserId) || [];

    this.refreshUI();
  }

  private injectDefaultsIfEmpty() {
    let changed = false;
    if (this.rawWallets.filter(w => !w.is_deleted).length === 0) {
      this.rawWallets.push({ id: Date.now().toString() + 'W1', name: 'Tunai', icon: 'cash', colorClass: 'success-box', is_deleted: false });
      changed = true;
    }
    if (this.rawCategories.filter(c => !c.is_deleted).length === 0) {
      this.rawCategories.push({ id: Date.now().toString() + 'C1', name: 'Makanan & Minuman', icon: 'fast-food', colorClass: 'warning-box', budget: 0, type: 'expense', is_deleted: false });
      this.rawCategories.push({ id: Date.now().toString() + 'C2', name: 'Transportasi', icon: 'bus', colorClass: 'tertiary-box', budget: 0, type: 'expense', is_deleted: false });
      this.rawCategories.push({ id: Date.now().toString() + 'C3', name: 'Gaji Bulanan', icon: 'cash', colorClass: 'success-box', budget: 0, type: 'income', is_deleted: false });
      changed = true;
    }
    if (changed) {
      this.saveDataToStorage('wallets_' + this.currentUserId, this.rawWallets);
      this.saveDataToStorage('categories_' + this.currentUserId, this.rawCategories);
      this.pushDataToServer();
    }
  }

  private refreshUI() {
    this.wallets.next(this.rawWallets.filter(w => !w.is_deleted));
    this.categories.next(this.rawCategories.filter(c => !c.is_deleted));
   
    const enrichedTransactions = this.rawTransactions
      .filter(t => !t.is_deleted)
      .map(t => {
        const w = this.rawWallets.find(wallet => wallet.id === t.wallet);
        if (w) {
          t.walletName = w.name;
          t.walletIcon = w.icon;
        }
        if (t.type === 'transfer' && t.toWallet) {
          const tw = this.rawWallets.find(wallet => wallet.id === t.toWallet);
          if (tw) {
            t.toWalletName = tw.name;
            t.toWalletIcon = tw.icon;
          }
        } else if (t.category) {
          const c = this.rawCategories.find(cat => cat.id === t.category);
          if (c) {
            t.categoryName = c.name;
            t.categoryIcon = c.icon;
          }
        }
        return t;
      });

    this.transactions.next(enrichedTransactions);
  }

  private saveDataToStorage(key: string, data: any) {
    if (this._storage) this._storage.set(key, data);
  }

  updateCurrency(code: string) { 
    localStorage.setItem('currency', code); 
    this.currency.next(code); 
  }
  
  updateUserProfile(profile: UserProfile) {
    if (!profile.avatarUrl || profile.avatarUrl.trim() === '') {
      profile.avatarUrl = 'assets/nopic.svg';
    }
    this.userProfile.next(profile);
    this.saveDataToStorage('userProfile_' + this.currentUserId, profile);
    this.pushDataToServer();
  }
  
  async resetData() {
    if (!this.currentUserId) return;

    try {
      const resetUrl = `${environment.apiUrl}sync.php?action=reset&user_id=${this.currentUserId}`;
      await lastValueFrom(this.http.post(resetUrl, {}));
    } catch (error) {}

    this.rawTransactions = [];
    this.rawWallets = [];
    this.rawCategories = [];

    this.saveDataToStorage('transactions_' + this.currentUserId, []);
    this.saveDataToStorage('wallets_' + this.currentUserId, []);
    this.saveDataToStorage('categories_' + this.currentUserId, []);

    this.injectDefaultsIfEmpty();
    this.refreshUI();
  }

  addWallet(wallet: Wallet) { wallet.is_deleted = false; this.rawWallets.push(wallet); this.refreshUI(); this.saveDataToStorage('wallets_' + this.currentUserId, this.rawWallets); this.pushDataToServer(); }
  updateWallet(updatedWallet: Wallet) { const index = this.rawWallets.findIndex(w => w.id === updatedWallet.id); if (index > -1) { updatedWallet.is_deleted = false; this.rawWallets[index] = updatedWallet; this.refreshUI(); this.saveDataToStorage('wallets_' + this.currentUserId, this.rawWallets); this.pushDataToServer(); } }
  deleteWallet(id: string) { const index = this.rawWallets.findIndex(w => w.id === id); if (index > -1) { this.rawWallets[index].is_deleted = true; this.refreshUI(); this.saveDataToStorage('wallets_' + this.currentUserId, this.rawWallets); this.pushDataToServer(); } }

  addCategory(category: Category) { category.is_deleted = false; this.rawCategories.push(category); this.refreshUI(); this.saveDataToStorage('categories_' + this.currentUserId, this.rawCategories); this.pushDataToServer(); }
  updateCategory(updatedCategory: Category) { const index = this.rawCategories.findIndex(c => c.id === updatedCategory.id); if (index > -1) { updatedCategory.is_deleted = false; this.rawCategories[index] = updatedCategory; this.refreshUI(); this.saveDataToStorage('categories_' + this.currentUserId, this.rawCategories); this.pushDataToServer(); } }
  deleteCategory(id: string) { const index = this.rawCategories.findIndex(c => c.id === id); if (index > -1) { this.rawCategories[index].is_deleted = true; this.refreshUI(); this.saveDataToStorage('categories_' + this.currentUserId, this.rawCategories); this.pushDataToServer(); } }

  addTransaction(trx: Transaction) { trx.is_deleted = false; this.rawTransactions.unshift(trx); this.refreshUI(); this.saveDataToStorage('transactions_' + this.currentUserId, this.rawTransactions); this.pushDataToServer(); }
  updateTransaction(updatedTrx: Transaction) { const index = this.rawTransactions.findIndex(t => t.id === updatedTrx.id); if (index > -1) { updatedTrx.is_deleted = false; this.rawTransactions[index] = updatedTrx; this.refreshUI(); this.saveDataToStorage('transactions_' + this.currentUserId, this.rawTransactions); this.pushDataToServer(); } }
  deleteTransaction(id: string) { const index = this.rawTransactions.findIndex(t => t.id === id); if (index > -1) { this.rawTransactions[index].is_deleted = true; this.refreshUI(); this.saveDataToStorage('transactions_' + this.currentUserId, this.rawTransactions); this.pushDataToServer(); } }

  async syncWithServer() {
    if (!this.currentUserId) return;
    try {
      const lastSync = localStorage.getItem('last_sync_' + this.currentUserId) || '2000-01-01 00:00:00';
      const pullUrl = `${environment.apiUrl}sync.php?action=pull&user_id=${this.currentUserId}&last_sync=${lastSync}`;
      const pullResponse: any = await lastValueFrom(this.http.get(pullUrl));
      if (pullResponse.status === 200 && pullResponse.data) {
        this.mergeIncomingData(pullResponse.data);
        localStorage.setItem('last_sync_' + this.currentUserId, pullResponse.server_time);
      }
      await this.pushDataToServer();
    } catch (error) {}
  }

  private async pushDataToServer() {
    if (!this.currentUserId) return;
    try {
      const currentProfile = this.userProfile.getValue();
      const payload = {
        wallets: this.rawWallets,
        categories: this.rawCategories,
        transactions: this.rawTransactions,
        user_profile: {
          name: currentProfile.name,
          avatarUrl: currentProfile.avatarUrl === 'assets/nopic.svg' ? null : currentProfile.avatarUrl
        }
      };
      const pushUrl = `${environment.apiUrl}sync.php?action=push&user_id=${this.currentUserId}`;
      await lastValueFrom(this.http.post(pushUrl, payload));
    } catch (error) {}
  }

  private mergeIncomingData(incomingData: any) {
    let hasChanges = false;
   
    if (incomingData.user_profile) {
      const currentProfile = this.userProfile.getValue();
      const newProfile = {
        ...currentProfile,
        name: incomingData.user_profile.name || currentProfile.name,
        email: incomingData.user_profile.email || currentProfile.email,
        avatarUrl: incomingData.user_profile.avatar_url || 'assets/nopic.svg'
      };
      this.userProfile.next(newProfile);
      this.saveDataToStorage('userProfile_' + this.currentUserId, newProfile);
      localStorage.setItem('user_name', newProfile.name);
      localStorage.setItem('user_avatar', newProfile.avatarUrl);
    }

    if (incomingData.wallets && incomingData.wallets.length > 0) { incomingData.wallets.forEach((inW: any) => { inW.is_deleted = inW.is_deleted == 1; const index = this.rawWallets.findIndex(w => w.id === inW.id); if (index > -1) this.rawWallets[index] = inW; else this.rawWallets.push(inW); hasChanges = true; }); if (hasChanges) this.saveDataToStorage('wallets_' + this.currentUserId, this.rawWallets); }
    if (incomingData.categories && incomingData.categories.length > 0) { incomingData.categories.forEach((inC: any) => { inC.is_deleted = inC.is_deleted == 1; inC.budget = parseFloat(inC.budget); const index = this.rawCategories.findIndex(c => c.id === inC.id); if (index > -1) this.rawCategories[index] = inC; else this.rawCategories.push(inC); hasChanges = true; }); if (hasChanges) this.saveDataToStorage('categories_' + this.currentUserId, this.rawCategories); }
    if (incomingData.transactions && incomingData.transactions.length > 0) { incomingData.transactions.forEach((inT: any) => { inT.is_deleted = inT.is_deleted == 1; inT.amount = parseFloat(inT.amount); const index = this.rawTransactions.findIndex(t => t.id === inT.id); if (index > -1) this.rawTransactions[index] = inT; else this.rawTransactions.push(inT); hasChanges = true; }); if (hasChanges) this.saveDataToStorage('transactions_' + this.currentUserId, this.rawTransactions); }
   
    if (hasChanges) this.refreshUI();
  }
}