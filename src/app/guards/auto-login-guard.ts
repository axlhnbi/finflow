import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AutoLoginGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    if (localStorage.getItem('user_id')) {
      this.router.navigate(['/tabs/tab1'], { replaceUrl: true });
      return false;
    }
    return true;
  }
}