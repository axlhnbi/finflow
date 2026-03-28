import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AlertController, IonModal, ActionSheetController, NavController } from '@ionic/angular';
import { ExpenseService, UserProfile, Category } from '../../services/expense.service';
import { UtilityService } from '../../services/utility.service';
import { TranslationService } from '../../services/translation.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: false
})
export class Tab4Page implements OnInit {
  @ViewChild('profileModal') profileModal!: IonModal;
  @ViewChild('categoryListModal') categoryListModal!: IonModal;
  @ViewChild('categoryFormModal') categoryFormModal!: IonModal;
  @ViewChild('iconModal') iconModal!: IonModal;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('catNameInput') catNameInput!: any;

  userProfile$!: Observable<UserProfile>;
  currency$!: Observable<string>;
  locale$!: Observable<string>;
  t: any = {};
  currentLang: string = 'id';
  filterType$ = new BehaviorSubject<'expense' | 'income'>('expense');
  filteredCategories$!: Observable<Category[]>;
  currentFilter: string = 'expense';
  isDarkMode: boolean = false;

  editName: string = '';
  editAvatarUrl: string = '';
  currentUserEmail: string = '';

  editingCategoryId: string | null = null;
  catName: string = '';
  catIcon: string = 'grid';
  catColor: string = 'primary-box';
  catBudget: number | null = null;
  catType: 'income' | 'expense' = 'expense';

  availableIcons: string[] = [
    'grid', 'fast-food', 'bus', 'game-controller', 'cart', 'home', 'medkit',
    'book', 'airplane', 'cafe', 'barbell', 'bag', 'cash', 'gift', 'business', 'wallet'
  ];
  availableColors: string[] = [
    'primary-box', 'success-box', 'warning-box', 'danger-box', 'tertiary-box', 'medium-box'
  ];

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private expenseService: ExpenseService,
    private utility: UtilityService,
    private translationService: TranslationService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.userProfile$ = this.expenseService.userProfile$;
    this.currency$ = this.expenseService.currency$;
    this.locale$ = this.expenseService.locale$;
   
    this.translationService.translations$.subscribe(dict => {
      this.t = dict;
    });
   
    this.translationService.currentLang$.subscribe(l => {
      this.currentLang = l;
    });

    this.filteredCategories$ = combineLatest([
      this.expenseService.categories$,
      this.filterType$
    ]).pipe(
      map(([cats, type]) => cats.filter(c => c.type === type))
    );

    const savedMode = localStorage.getItem('darkMode');
    this.isDarkMode = savedMode === 'true';
    document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode);
  }

  toggleTheme(event: any) {
    this.isDarkMode = event.detail.checked;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode);
  }

  async changeCurrency() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.t.CURRENCY,
      buttons: [
        { text: 'Rupiah (IDR)', handler: () => this.expenseService.updateCurrency('IDR') },
        { text: 'US Dollar (USD)', handler: () => this.expenseService.updateCurrency('USD') },
        { text: this.t.CANCEL, role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async changeLanguage() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.t.LANGUAGE,
      buttons: [
        { text: 'Indonesia', handler: () => this.translationService.setLanguage('id') },
        { text: 'English', handler: () => this.translationService.setLanguage('en') },
        { text: this.t.CANCEL, role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  openProfileEdit() {
    this.userProfile$.pipe(take(1)).subscribe(profile => {
      this.editName = profile.name;
      this.editAvatarUrl = profile.avatarUrl || 'assets/nopic.svg';
      this.currentUserEmail = profile.email;
      this.profileModal.present();
    });
  }

  async presentAvatarActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.t.CHANGE_PHOTO,
      buttons: [
        { text: this.t.UPLOAD_PHOTO, icon: 'image', handler: () => { this.triggerFileUpload(); } },
        { text: this.t.REMOVE_PHOTO, icon: 'trash', role: 'destructive', handler: () => { this.removeAvatar(); } },
        { text: this.t.CANCEL, icon: 'close', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  triggerFileUpload() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  removeAvatar() {
    this.editAvatarUrl = 'assets/nopic.svg';
    this.utility.showToast(this.t.PHOTO_REMOVED, 'success');
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('user_id', userId);

    await this.utility.showLoading('Mengunggah...');

    this.http.post<any>(`${environment.apiUrl}upload_avatar.php`, formData).subscribe({
      next: async (res) => {
        await this.utility.hideLoading();
        if (res.status === 200 && res.url) {
          this.editAvatarUrl = res.url;
          this.utility.showToast(this.t.PHOTO_UPLOADED, 'success');
        } else {
          this.utility.showToast(res.message, 'danger');
        }
        event.target.value = '';
      },
      error: async (err) => {
        await this.utility.hideLoading();
        this.utility.showToast('Gagal mengunggah foto.', 'danger');
        event.target.value = '';
      }
    });
  }

  saveProfile() {
    if (!this.editName.trim()) {
      this.utility.showToast(this.currentLang === 'id' ? 'Nama tidak boleh kosong!' : 'Name cannot be empty!', 'danger');
      return;
    }
    this.expenseService.updateUserProfile({
      name: this.editName,
      email: this.currentUserEmail,
      avatarUrl: this.editAvatarUrl,
      greeting: this.t.GREETING_DESC
    });
    this.profileModal.dismiss();
  }

  openCategoryList() {
    this.categoryListModal.present();
  }

  closeCategoryList() {
    this.categoryListModal.dismiss();
  }

  onFilterChange() {
    this.filterType$.next(this.currentFilter as 'expense' | 'income');
  }

  focusCatNameInput() {
    if (this.catNameInput) {
      setTimeout(() => {
        this.catNameInput.setFocus();
      }, 150);
    }
  }

  openAddCategory() {
    this.editingCategoryId = null;
    this.catName = '';
    this.catIcon = 'grid';
    this.catColor = 'primary-box';
    this.catBudget = null;
    this.catType = this.currentFilter as 'expense' | 'income';
    this.categoryFormModal.present();
  }

  editCategory(cat: Category) {
    this.editingCategoryId = cat.id;
    this.catName = cat.name;
    this.catIcon = cat.icon;
    this.catColor = cat.colorClass;
    this.catBudget = cat.budget === 0 ? null : cat.budget;
    this.catType = cat.type;
    this.categoryFormModal.present();
  }

  async deleteCategory(id: string) {
    const alert = await this.alertController.create({
      header: this.t.DELETE,
      message: this.currentLang === 'id' ? 'Hapus kategori ini?' : 'Delete this category?',
      buttons: [
        { text: this.t.CANCEL, role: 'cancel' },
        { text: this.t.DELETE, role: 'destructive', handler: () => { this.expenseService.deleteCategory(id); } }
      ]
    });
    await alert.present();
  }

  saveCategory() {
    if (!this.catName.trim()) {
      this.utility.showToast(this.currentLang === 'id' ? 'Nama kategori wajib diisi!' : 'Category name is required!', 'danger');
      return;
    }
   
    const catData: Category = {
      id: this.editingCategoryId || Date.now().toString(),
      name: this.catName,
      icon: this.catIcon,
      colorClass: this.catColor,
      budget: this.catType === 'expense' ? (this.catBudget || 0) : 0,
      type: this.catType
    };

    if (this.editingCategoryId) {
      this.expenseService.updateCategory(catData);
    } else {
      this.expenseService.addCategory(catData);
    }
   
    this.categoryFormModal.dismiss();
  }

  openIconPicker() {
    this.iconModal.present();
  }

  selectIcon(icon: string) {
    this.catIcon = icon;
    this.iconModal.dismiss();
  }

  selectColor(color: string) {
    this.catColor = color;
  }

  async exportData() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.t.EXPORT,
      buttons: [
        {
          text: this.currentLang === 'id' ? 'Unduh Excel (CSV)' : 'Download Excel (CSV)',
          icon: 'document-text',
          handler: () => {
            this.expenseService.transactions$.pipe(take(1)).subscribe(trx => this.utility.exportToExcel(trx));
          }
        },
        {
          text: this.currentLang === 'id' ? 'Unduh PDF' : 'Download PDF',
          icon: 'print',
          handler: () => {
            this.expenseService.transactions$.pipe(take(1)).subscribe(trx => this.utility.exportToPDF(trx));
          }
        },
        { text: this.t.CANCEL, role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async confirmReset() {
    const alert = await this.alertController.create({
      header: this.t.RESET,
      message: this.currentLang === 'id' ? 'Reset semua data secara permanen?' : 'Reset all data permanently?',
      buttons: [
        { text: this.t.CANCEL, role: 'cancel' },
        { 
          text: this.t.RESET, 
          role: 'destructive', 
          handler: async () => { 
            await this.utility.showLoading(this.currentLang === 'id' ? 'Mereset data...' : 'Resetting data...');
            await this.expenseService.resetData(); 
            await this.utility.hideLoading();
            this.utility.showToast(
              this.currentLang === 'id' ? 'Semua data berhasil direset.' : 'All data successfully reset.', 
              'success'
            );
          } 
        }
      ]
    });
    await alert.present();
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: this.t.LOGOUT,
      message: this.currentLang === 'id' ? 'Apakah Anda yakin ingin keluar?' : 'Are you sure you want to log out?',
      buttons: [
        { text: this.t.CANCEL, role: 'cancel' },
        {
          text: this.t.LOGOUT,
          role: 'destructive',
          handler: () => {
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_avatar');
            this.navCtrl.navigateRoot('/login', { animationDirection: 'back' });
          }
        }
      ]
    });
    await alert.present();
  }
}