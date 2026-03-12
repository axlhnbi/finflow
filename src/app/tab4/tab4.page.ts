import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonModal, ActionSheetController } from '@ionic/angular';
import { ExpenseService, UserProfile, Category } from '../../services/expense.service';
import { UtilityService } from '../../services/utility.service';
import { TranslationService } from '../../services/translation.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';

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
    private router: Router,
    private alertController: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private expenseService: ExpenseService,
    private utility: UtilityService,
    private translationService: TranslationService
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
      this.editAvatarUrl = profile.avatarUrl;
      this.currentUserEmail = profile.email;
      this.profileModal.present();
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
      avatarUrl: this.editAvatarUrl || 'https://ionicframework.com/docs/img/demos/avatar.svg',
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
      message: this.currentLang === 'id' ? 'Reset semua data?' : 'Reset all data?',
      buttons: [
        { text: this.t.CANCEL, role: 'cancel' },
        { text: this.t.RESET, role: 'destructive', handler: () => { this.expenseService.resetData(); } }
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
        { text: this.t.LOGOUT, role: 'destructive', handler: () => this.router.navigate(['/login']) }
      ]
    });
    await alert.present();
  }
}