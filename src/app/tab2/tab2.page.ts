import { Component, OnInit, OnDestroy } from '@angular/core';
import Chart from 'chart.js/auto';
import { ExpenseService, Transaction, Category } from '../../services/expense.service';
import { TranslationService } from '../../services/translation.service';
import { Subscription, combineLatest, Observable } from 'rxjs';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit, OnDestroy {
  chart: any;
  selectedPeriod: string = 'monthly';
  recapType: 'expense' | 'income' = 'expense';
  totalAmount: number = 0;
  categorySummary: any[] = [];
  
  currency$!: Observable<string>;
  locale$!: Observable<string>;
  t: any = {};
  
  private dataSub!: Subscription;
  private allTransactions: Transaction[] = [];
  private allCategories: Category[] = [];
  private colorMap: Record<string, string> = { 'primary-box': '#3880FF', 'success-box': '#2dd36f', 'warning-box': '#FFC409', 'danger-box': '#EB445A', 'tertiary-box': '#5260FF', 'medium-box': '#92949c' };

  constructor(private expenseService: ExpenseService, private translationService: TranslationService) {}

  ngOnInit() {
    this.currency$ = this.expenseService.currency$;
    this.locale$ = this.expenseService.locale$;
    this.translationService.translations$.subscribe(dict => this.t = dict);
    this.dataSub = combineLatest([this.expenseService.transactions$, this.expenseService.categories$]).subscribe(([transactions, categories]) => {
      this.allTransactions = transactions; this.allCategories = categories; this.processData();
    });
  }

  ngOnDestroy() { if (this.dataSub) this.dataSub.unsubscribe(); if (this.chart) this.chart.destroy(); }
  ionViewDidEnter() { this.initChart(); this.processData(); }
  handleRefresh(event: any) { setTimeout(() => { event.target.complete(); }, 1500); }
  onFilterChange() { this.processData(); }

  processData() {
    const now = new Date();
    let filtered = this.allTransactions.filter(t => t.type === this.recapType);
    if (this.selectedPeriod === 'daily') filtered = filtered.filter(t => new Date(t.date).toDateString() === now.toDateString());
    else if (this.selectedPeriod === 'weekly') { const p = new Date(); p.setDate(now.getDate() - 7); filtered = filtered.filter(t => new Date(t.date) >= p); }
    else if (this.selectedPeriod === 'monthly') filtered = filtered.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());

    this.totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);
    const summaryMap = new Map<string, any>();

    filtered.forEach(trx => {
      const catId = trx.category || 'lainnya';
      let catData = this.allCategories.find(c => c.id === catId);
      if (summaryMap.has(catId)) summaryMap.get(catId)!.amount += trx.amount;
      else summaryMap.set(catId, { id: catId, name: catData ? catData.name : trx.categoryName, icon: catData ? catData.icon : trx.categoryIcon, amount: trx.amount, percentage: 0, colorHex: this.colorMap[catData ? catData.colorClass : 'primary-box'] || '#3880FF', colorClass: catData ? catData.colorClass : 'primary-box', budget: catData ? catData.budget : 0 });
    });

    this.categorySummary = Array.from(summaryMap.values()).map(cat => ({ ...cat, percentage: this.totalAmount > 0 ? (cat.amount / this.totalAmount) * 100 : 0 })).sort((a, b) => b.amount - a.amount);
    this.updateChart();
  }

  initChart() {
    const canvas = document.getElementById('pieChart') as HTMLCanvasElement; if (!canvas) return;
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(canvas, { type: 'doughnut', data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 2, hoverOffset: 6, borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } } } });
  }
  updateChart() {
    if (!this.chart) return;
    if (this.categorySummary.length === 0) { this.chart.data.labels = [this.t.NO_DATA]; this.chart.data.datasets[0].data = [1]; this.chart.data.datasets[0].backgroundColor = ['#e0e0e0']; } 
    else { this.chart.data.labels = this.categorySummary.map(c => c.name); this.chart.data.datasets[0].data = this.categorySummary.map(c => c.amount); this.chart.data.datasets[0].backgroundColor = this.categorySummary.map(c => c.colorHex); }
    this.chart.update();
  }
}