import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UtilityService } from '../../services/utility.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  step: 'form' | 'otp' = 'form';
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  otp = '';
  
  showPassword = false;
  showConfirmPassword = false;
  t: any = {};

  constructor(
    private router: Router,
    private http: HttpClient,
    private utility: UtilityService,
    private translationService: TranslationService
  ) { }

  ngOnInit() {
    this.translationService.translations$.subscribe(dict => {
      this.t = dict;
    });
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  async requestOtp() {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.utility.showToast(this.t.REG_ERR_EMPTY, 'danger');
      return;
    }
    if (this.password.length < 8) {
      this.utility.showToast(this.t.REG_ERR_PWD_LENGTH, 'danger');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.utility.showToast(this.t.REG_ERR_MATCH, 'danger');
      return;
    }

    await this.utility.showLoading(this.t.SENDING_OTP);

    this.http.post<any>(`${environment.apiUrl}auth.php?action=send_otp`, { email: this.email }).subscribe({
      next: async (res) => {
        await this.utility.hideLoading();
        if (res.status === 200) {
          this.utility.showToast(this.t.OTP_SENT, 'success', 3000);
          this.step = 'otp';
        } else {
          this.utility.showToast(res.message, 'danger');
        }
      },
      error: async (err) => {
        await this.utility.hideLoading();
        this.utility.showToast(err.error?.message || this.t.REG_ERR_NETWORK, 'danger');
      }
    });
  }

  async verifyAndRegister() {
    if (!this.otp || this.otp.length < 6) {
      this.utility.showToast('OTP tidak valid', 'danger');
      return;
    }

    await this.utility.showLoading(this.t.REG_LOADING);

    const payload = { name: this.name, email: this.email, password: this.password, otp: this.otp };

    this.http.post<any>(`${environment.apiUrl}auth.php?action=register`, payload).subscribe({
      next: async (res) => {
        await this.utility.hideLoading();
        if (res.status === 201) {
          this.utility.showToast('Akun berhasil dibuat!', 'success');
          this.router.navigate(['/login'], { replaceUrl: true });
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