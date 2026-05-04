import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UtilityService } from '../../services/utility.service';
import { ExpenseService } from '../../services/expense.service';
import { TranslationService } from '../../services/translation.service';
import { UserService } from 'src/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  mode: 'login' | 'forgot-email' | 'forgot-reset' = 'login';
  
  email = '';
  password = '';
  otp = '';
  newPassword = '';
  confirmNewPassword = '';

  showPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;
  t: any = {};

  constructor(
    private router: Router,
    private http: HttpClient,
    private utility: UtilityService,
    private expenseService: ExpenseService,
    private translationService: TranslationService,
    private userServ: UserService
  ) { }

  ngOnInit() {
    this.translationService.translations$.subscribe(dict => {
      this.t = dict;
    });
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleNewPassword() { this.showNewPassword = !this.showNewPassword; }
  toggleConfirmNewPassword() { this.showConfirmNewPassword = !this.showConfirmNewPassword; }

  setMode(newMode: 'login' | 'forgot-email' | 'forgot-reset') {
    this.mode = newMode;
    this.password = '';
    this.otp = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
    if (newMode === 'login') {
      this.email = '';
    }
  }

  async doLogin(){
    if (!this.email || !this.password) {
      this.utility.showToast(this.t.LOGIN_ERR_EMPTY, 'danger');
      return;
    }

    await this.utility.showLoading(this.t.LOGIN_LOADING);

    this.userServ.login({ email: this.email, password:this.password }).subscribe({
      next: async res => {
        await this.utility.hideLoading();
        if (res.status === 200 && res.data) {
          localStorage.setItem('user_id', res.data.id);
          localStorage.setItem('user_name', res.data.name);
          localStorage.setItem('user_email', res.data.email);
          if (res.data.avatar_url && res.data.avatar_url.trim() !== '') {
            localStorage.setItem('user_avatar', res.data.avatar_url);
          } else {
            localStorage.setItem('user_avatar', 'assets/nopic.svg');
          }
          await this.expenseService.initDatabase();
          this.router.navigate(['/tabs/tab1'], { replaceUrl: true }); 
        }else{
          this.utility.showToast(res.message || this.t.LOGIN_ERR_FAILED, 'danger');
        }
      },
      error: async err => {
        this.utility.hideLoading();
        this.utility.showToast(err.error.message || this.t.LOGIN_ERR_FAILED, 'danger');
      }
    })
  }

  async requestResetOtp() {
    if (!this.email) {
      this.utility.showToast(this.t.REG_ERR_EMPTY, 'danger');
      return;
    }
    await this.utility.showLoading(this.t.SENDING_OTP);
    this.http.post<any>(`${environment.apiUrl}auth.php?action=forgot_password_otp`, { email: this.email }).subscribe({
      next: async (res) => {
        await this.utility.hideLoading();
        if (res.status === 200) {
          this.utility.showToast(this.t.OTP_SENT, 'success', 3000);
          this.mode = 'forgot-reset';
        } else {
          this.utility.showToast(res.message, 'danger');
        }
      },
      error: async (err) => {
        await this.utility.hideLoading();
        this.utility.showToast(err.error?.message || this.t.EMAIL_NOT_FOUND, 'danger');
      }
    });
  }

  async verifyAndResetPassword() {
    if (!this.otp || !this.newPassword || !this.confirmNewPassword) {
      this.utility.showToast(this.t.REG_ERR_EMPTY, 'danger');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.utility.showToast(this.t.REG_ERR_MATCH, 'danger');
      return;
    }
    await this.utility.showLoading(this.t.REG_LOADING);
    const payload = { email: this.email, otp: this.otp, new_password: this.newPassword };
    this.http.post<any>(`${environment.apiUrl}auth.php?action=reset_password`, payload).subscribe({
      next: async (res) => {
        await this.utility.hideLoading();
        if (res.status === 200) {
          this.utility.showToast(this.t.PWD_CHANGED_SUCCESS, 'success');
          this.setMode('login');
        } else {
          this.utility.showToast(res.message, 'danger');
        }
      },
      error: async (err) => {
        await this.utility.hideLoading();
        this.utility.showToast(err.error?.message || this.t.ERR_OTP_INVALID, 'danger');
      }
    });
  }
}