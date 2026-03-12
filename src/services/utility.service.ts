import { Injectable } from '@angular/core';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Transaction } from './expense.service';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {
  private loadingElement: HTMLIonLoadingElement | null = null;

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header, message, buttons: ['OK'], mode: 'ios'
    });
    await alert.present();
  }

  async showToast(message: string, color: string = 'dark', duration: number = 2000) {
    const toast = await this.toastCtrl.create({
      message, color, duration, position: 'top', mode: 'ios'
    });
    await toast.present();
  }

  async showLoading(message: string = 'Mohon tunggu...') {
    this.loadingElement = await this.loadingCtrl.create({
      message, spinner: 'crescent', mode: 'ios'
    });
    await this.loadingElement.present();
  }

  async hideLoading() {
    if (this.loadingElement) {
      await this.loadingElement.dismiss();
      this.loadingElement = null;
    }
  }

  exportToExcel(transactions: Transaction[]) {
    const headers = ['Tanggal', 'Tipe', 'Kategori/Tujuan', 'Rekening Asal', 'Nominal', 'Catatan'];
    const rows = transactions.map(t => {
      const date = new Date(t.date).toLocaleDateString();
      const type = t.type === 'expense' ? 'Pengeluaran' : (t.type === 'income' ? 'Pemasukan' : 'Transfer');
      const target = t.type === 'transfer' ? t.toWalletName : (t.categoryName || '-');
      return `${date},${type},${target},${t.walletName},${t.amount},"${t.notes || ''}"`;
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `Laporan_Keuangan_${Date.now()}.csv`);
  }

  exportToPDF(transactions: Transaction[]) {
    let tableRows = transactions.map(t => {
      const target = t.type === 'transfer' ? t.toWalletName : (t.categoryName || '-');
      return `<tr><td>${new Date(t.date).toLocaleDateString()}</td><td>${t.type}</td><td>${target}</td><td>${t.amount}</td></tr>`;
    }).join('');

    const htmlContent = `
      <html><head><title>Laporan Keuangan</title>
      <style>body{font-family:sans-serif;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background-color:#f2f2f2;}</style>
      </head><body><h2>Laporan Transaksi</h2>
      <table><tr><th>Tanggal</th><th>Tipe</th><th>Kategori/Tujuan</th><th>Nominal</th></tr>${tableRows}</table>
      <script>window.onload = function() { window.print(); window.close(); }</script>
      </body></html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      this.showToast('Gagal membuka jendela PDF. Izinkan pop-up di browser Anda.', 'danger');
    }
  }

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}