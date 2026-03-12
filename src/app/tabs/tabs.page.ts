import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false
})
export class TabsPage implements OnInit {
  t: any = {};

  constructor(private translationService: TranslationService) {}

  ngOnInit() {
    this.translationService.translations$.subscribe(dict => {
      this.t = dict;
    });
  }
}