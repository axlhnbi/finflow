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
    if (savedLang) { this.setLanguage(savedLang); }
    if (!savedLang || !savedCurrency) {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const isIndonesia = data && data.country_code === 'ID';
        if (!savedLang) { this.setLanguage(isIndonesia ? 'id' : 'en'); }
        if (!savedCurrency) { this.expenseService.updateCurrency(isIndonesia ? 'IDR' : 'USD'); }
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
        TAB_PROFILE: "Profil",
        WELCOME: "Selamat Datang! 👋",
        WELCOME_DESC: "Catat pengeluaran jadi lebih cepat dan aman.",
        EMAIL_ADDR: "Alamat Email",
        PASSWORD: "Kata Sandi",
        FORGOT_PWD: "Lupa Kata Sandi?",
        LOGIN: "Masuk",
        NO_ACCOUNT: "Belum punya akun?",
        REGISTER_NOW: "Daftar sekarang",
        LOGIN_ERR_EMPTY: "Email dan kata sandi wajib diisi!",
        LOGIN_LOADING: "Proses masuk...",
        LOGIN_ERR_FAILED: "Masuk gagal.",
        LOGIN_ERR_NETWORK: "Terjadi kesalahan jaringan atau server.",
        CREATE_ACCOUNT: "Buat Akun Baru 🚀",
        CREATE_ACCOUNT_DESC: "Mulai perjalanan finansialmu hari ini.",
        FULL_NAME: "Nama Lengkap",
        CONFIRM_PWD: "Konfirmasi Kata Sandi",
        REGISTER_START: "Daftar & Mulai",
        HAVE_ACCOUNT: "Sudah punya akun?",
        LOGIN_HERE: "Masuk di sini",
        REG_ERR_EMPTY: "Semua kolom wajib diisi!",
        REG_ERR_MATCH: "Kata Sandi dan Konfirmasi tidak cocok!",
        REG_LOADING: "Mendaftarkan akun...",
        REG_ERR_FAILED: "Registrasi gagal.",
        REG_ERR_NETWORK: "Registrasi gagal. Pastikan email belum terdaftar.",
        SENDING_OTP: "Mengirim kode OTP...",
        OTP_SENT: "Kode OTP telah dikirim ke email Anda.",
        OTP_INPUT: "Masukkan Kode OTP",
        VERIFY_OTP: "Verifikasi & Buat Akun",
        ERR_OTP_INVALID: "OTP salah atau sudah kadaluarsa.",
        FORGOT_PWD_TITLE: "Ubah Kata Sandi 🔒",
        FORGOT_PWD_DESC: "Masukkan email yang terdaftar untuk menerima OTP.",
        SEND_OTP_BTN: "Kirim OTP",
        NEW_PWD: "Kata Sandi Baru",
        CONFIRM_NEW_PWD: "Konfirmasi Kata Sandi Baru",
        RESET_BTN: "Simpan Kata Sandi",
        BACK_TO_LOGIN: "Kembali ke Login",
        PWD_CHANGED_SUCCESS: "Kata sandi berhasil diubah!",
        EMAIL_NOT_FOUND: "Email tidak terdaftar.",
        CHANGE_PHOTO: "Ubah Foto",
        UPLOAD_PHOTO: "Unggah dari Galeri",
        REMOVE_PHOTO: "Hapus Foto",
        PHOTO_UPLOADED: "Foto berhasil diunggah!",
        PHOTO_REMOVED: "Foto telah dihapus."
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
        TAB_PROFILE: "Profile",
        WELCOME: "Welcome! 👋",
        WELCOME_DESC: "Track expenses faster and safer.",
        EMAIL_ADDR: "Email Address",
        PASSWORD: "Password",
        FORGOT_PWD: "Forgot Password?",
        LOGIN: "Login",
        NO_ACCOUNT: "Don't have an account?",
        REGISTER_NOW: "Register now",
        LOGIN_ERR_EMPTY: "Email and password are required!",
        LOGIN_LOADING: "Logging in...",
        LOGIN_ERR_FAILED: "Login failed.",
        LOGIN_ERR_NETWORK: "Network or server error occurred.",
        CREATE_ACCOUNT: "Create Account 🚀",
        CREATE_ACCOUNT_DESC: "Start your financial journey today.",
        FULL_NAME: "Full Name",
        CONFIRM_PWD: "Confirm Password",
        REGISTER_START: "Register & Start",
        HAVE_ACCOUNT: "Already have an account?",
        LOGIN_HERE: "Login here",
        REG_ERR_EMPTY: "All fields are required!",
        REG_ERR_MATCH: "Passwords do not match!",
        REG_LOADING: "Registering account...",
        REG_ERR_FAILED: "Registration failed.",
        REG_ERR_NETWORK: "Registration failed. Ensure email is not registered.",
        SENDING_OTP: "Sending OTP code...",
        OTP_SENT: "OTP code sent to your email.",
        OTP_INPUT: "Enter OTP Code",
        VERIFY_OTP: "Verify & Create Account",
        ERR_OTP_INVALID: "Invalid or expired OTP.",
        FORGOT_PWD_TITLE: "Change Password 🔒",
        FORGOT_PWD_DESC: "Enter registered email to receive OTP.",
        SEND_OTP_BTN: "Send OTP",
        NEW_PWD: "New Password",
        CONFIRM_NEW_PWD: "Confirm New Password",
        RESET_BTN: "Save Password",
        BACK_TO_LOGIN: "Back to Login",
        PWD_CHANGED_SUCCESS: "Password changed successfully!",
        EMAIL_NOT_FOUND: "Email is not registered.",
        CHANGE_PHOTO: "Change Photo",
        UPLOAD_PHOTO: "Upload from Gallery",
        REMOVE_PHOTO: "Remove Photo",
        PHOTO_UPLOADED: "Photo uploaded successfully!",
        PHOTO_REMOVED: "Photo has been removed."
      }
    };
    return dict[lang];
  }
}