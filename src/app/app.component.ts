import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslationService } from '../services/translation.service';
import { SplashScreen } from '@capacitor/splash-screen';

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
    this.platform.ready().then( async () => {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode === 'true') {
        document.documentElement.classList.add('ion-palette-dark');
      } else {
        document.documentElement.classList.remove('ion-palette-dark');
      }

      await SplashScreen.hide();
      
    });
  }
}