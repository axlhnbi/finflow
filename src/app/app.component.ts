import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private translationService: TranslationService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    // Memastikan DOM dan platform Ionic sudah siap sepenuhnya
    this.platform.ready().then(() => {
      
      // Terapkan Mode Malam secara global di seluruh aplikasi
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode === 'true') {
        document.documentElement.classList.add('ion-palette-dark');
      } else {
        document.documentElement.classList.remove('ion-palette-dark');
      }
      
    });
  }
}