import { Injectable } from '@angular/core';
import { Observable, throwError, tap, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { NetworkService } from './network.service';
import { UtilityService } from './utility.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

    constructor (
        private http: HttpClient,
        private network: NetworkService,
        private utility: UtilityService
    ){}

    login(data: any): Observable<any> {
        if(this.network.isOnline()){
            return this.http.post(`${environment.apiUrl}auth.php?action=login`, {
                email: data.email,
                password: data.password,
            }).pipe(
                tap(res => res),
                map(err => err)
            );
        }else{
            this.utility.hideLoading();
            this.network.toastNetworkOffline();
            return throwError("No internet connection");
        }
    }
}