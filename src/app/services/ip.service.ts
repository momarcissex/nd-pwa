import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class IpService {

  constructor(
    private http: HttpClient
  ) { }

  getIPAddress() {
    return this.http.get('https://api.ipify.org?format=json', {});
  }
}
