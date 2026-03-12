import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ExpenseService } from './expense.service';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang = new BehaviorSubject<string>('id');
  currentLang$ = this.currentLang.asObservable();
  
  private translations = new BehaviorSubject<any>(this.getDictionary('id'));
  translations$ = this.translations.asObservable();

  constructor(private expenseService: ExpenseService) {
    this.initLanguageAndCurrency();
  }

  private async initLanguageAndCurrency() {
    const savedLang = localStorage.getItem('appLang');
    const savedCurrency = localStorage.getItem('currency');

    if (savedLang) {
      this.setLanguage(savedLang);
    }

    if (!savedLang || !savedCurrency) {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const isIndonesia = data && data.country_code === 'ID';

        if (!savedLang) {
          this.setLanguage(isIndonesia ? 'id' : 'en');
        }
        
        if (!savedCurrency) {
          this.expenseService.updateCurrency(isIndonesia ? 'IDR' : 'USD');
        }
      } catch (error) {
        if (!savedLang) this.setLanguage('en');
        if (!savedCurrency) this.expenseService.updateCurrency('USD');
      }
    }
  }

  setLanguage(lang: string) {
    localStorage.setItem('appLang', lang);
    this.currentLang.next(lang);
    this.translations.next(this.getDictionary(lang));
  }

  getCurrentLang() {
    return this.currentLang.getValue();
  }

  private getDictionary(lang: string) {
    const dict: any = {
      id: {
        GREETING_DESC: "Siap kelola uangmu?",
        TRANSACTIONS: "Transaksi",
        NO_TRANSACTION: "Belum ada transaksi di tanggal ini.",
        EXPENSE: "Keluar",
        INCOME: "Masuk",
        TRANSFER: "Pindah",
        FROM_WALLET: "Dari Rekening",
        TO_WALLET: "Ke Rekening",
        CHOOSE_CATEGORY: "Pilih Kategori",
        CHOOSE_WALLET: "Pilih Rekening",
        NEW_CATEGORY: "Buat Kategori Baru",
        NEW_WALLET: "Buat Rekening Baru",
        SAVE: "Simpan",
        CANCEL: "Batal",
        EDIT: "Edit",
        DELETE: "Hapus",
        TITLE_PLACEHOLDER: "Judul Aktivitas (Maks 30 huruf)",
        NOTES_PLACEHOLDER: "Tambahkan catatan (opsional)...",
        TRX_TIME: "Waktu Transaksi",
        ADD_TRX: "Tambah Transaksi",
        EDIT_TRX: "Edit Transaksi",
        DEL_TRX_MSG: "Apakah Anda yakin ingin menghapus transaksi ini?",
        RECAP: "Rekapitulasi",
        RECAP_DESC: "Pantau arus kas kamu di sini",
        DAILY: "Harian",
        WEEKLY: "Mingguan",
        MONTHLY: "Bulanan",
        TOTAL: "Total",
        CAT_DETAIL: "Detail Kategori",
        NO_DATA: "Belum ada data di periode ini.",
        NO_LIMIT: "Tanpa Limit",
        WALLETS: "Rekening",
        WALLETS_DESC: "Pantau saldo di semua dompetmu",
        ACTIVE_BALANCE: "Total Saldo Aktif",
        WALLET_LIST: "Daftar Rekening",
        NO_WALLET: "Belum ada rekening ditambahkan.",
        PROFILE: "Profil",
        PROFILE_DESC: "Pengaturan & Preferensi",
        PREFERENCES: "Preferensi Aplikasi",
        DARK_MODE: "Mode Malam",
        CURRENCY: "Format Mata Uang",
        LANGUAGE: "Bahasa",
        MANAGE_CAT: "Manajemen Kategori",
        DATA_SEC: "Data & Keamanan",
        EXPORT: "Export Laporan",
        RESET: "Reset Semua Data",
        LOGOUT: "Keluar",
        CAT_DESC: "Atur kategori dan limit budget bulanan agar keuanganmu terkontrol.",
        CLOSE: "Tutup",
        TAB_HOME: "Beranda",
        TAB_RECAP: "Rekap",
        TAB_WALLETS: "Dompet",
        TAB_PROFILE: "Profil"
      },
      en: {
        GREETING_DESC: "Ready to manage your money?",
        TRANSACTIONS: "Transactions",
        NO_TRANSACTION: "No transactions on this date.",
        EXPENSE: "Expense",
        INCOME: "Income",
        TRANSFER: "Transfer",
        FROM_WALLET: "From Wallet",
        TO_WALLET: "To Wallet",
        CHOOSE_CATEGORY: "Select Category",
        CHOOSE_WALLET: "Select Wallet",
        NEW_CATEGORY: "Create New Category",
        NEW_WALLET: "Create New Wallet",
        SAVE: "Save",
        CANCEL: "Cancel",
        EDIT: "Edit",
        DELETE: "Delete",
        TITLE_PLACEHOLDER: "Activity Title (Max 30 chars)",
        NOTES_PLACEHOLDER: "Add notes (optional)...",
        TRX_TIME: "Transaction Time",
        ADD_TRX: "Add Transaction",
        EDIT_TRX: "Edit Transaction",
        DEL_TRX_MSG: "Are you sure you want to delete this transaction?",
        RECAP: "Recap",
        RECAP_DESC: "Monitor your cash flow here",
        DAILY: "Daily",
        WEEKLY: "Weekly",
        MONTHLY: "Monthly",
        TOTAL: "Total",
        CAT_DETAIL: "Category Details",
        NO_DATA: "No data in this period.",
        NO_LIMIT: "No Limit",
        WALLETS: "Wallets",
        WALLETS_DESC: "Monitor balances in all wallets",
        ACTIVE_BALANCE: "Active Balance",
        WALLET_LIST: "Wallet List",
        NO_WALLET: "No wallets added yet.",
        PROFILE: "Profile",
        PROFILE_DESC: "Settings & Preferences",
        PREFERENCES: "App Preferences",
        DARK_MODE: "Dark Mode",
        CURRENCY: "Currency Format",
        LANGUAGE: "Language",
        MANAGE_CAT: "Category Management",
        DATA_SEC: "Data & Security",
        EXPORT: "Export Report",
        RESET: "Reset All Data",
        LOGOUT: "Logout",
        CAT_DESC: "Set categories and monthly budgets to keep your finances controlled.",
        CLOSE: "Close",
        TAB_HOME: "Home",
        TAB_RECAP: "Recap",
        TAB_WALLETS: "Wallets",
        TAB_PROFILE: "Profile"
      }
    };
    return dict[lang];
  }
}