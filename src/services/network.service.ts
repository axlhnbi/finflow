import { Injectable } from '@angular/core';
import { Platform, ToastController } from '@ionic/angular';
import { Network } from '@capacitor/network';
import { PluginListenerHandle } from '@capacitor/core';
import { EventsService } from './event.service';

declare var Connection: any;
declare var navigator: any;

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  disconnect: boolean = false;
  toasts: Array<any> = [];
  networkStatus: any;
  networkListener: PluginListenerHandle | undefined;

  constructor(
    public platform: Platform,
    public toastCtrl: ToastController,
    private events: EventsService
  ) {
    this.initAwait();
  }

  async initAwait() {
    this.networkListener = await Network.addListener('networkStatusChange', (status) => {
      this.networkStatus = status;
      if(this.networkStatus.connectionType === 'none') {
        this.events.publish('SHOW:OFFLINE', {offline: 'No Connection.'});
      } else {
        this.events.publish('SHOW:OFFLINE', {online: 'Connected.'});
      }
    });
  }

  isOnline = (): boolean => {
    // this.networkStatus = await Network.getStatus();
    if(this.networkStatus && this.networkStatus.connectionType) {
      return this.networkStatus.connectionType !== 'none';
    } else {
      return navigator.onLine;
    }
  };

  isOffline(): boolean {
    if(this.networkStatus && this.networkStatus.connectionType) {
      return this.networkStatus.connectionType === 'none';
    } else {
      return !navigator.onLine;
    }
  }

  async toastNetworkOffline() {
    let val: string;
      val = "There is no internet connection.";

      let toast = await this.toastCtrl.create({
        message: val,
        duration: 3000,
        position: 'top'
      });
      this.toasts.push(toast);

      if(this.toasts.length == 1){
        toast.present();
      } else {
        this.toasts.pop();
      }

      toast.onDidDismiss().then(() => {
        this.toasts.pop();
      });
    
  }
}
