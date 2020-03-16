import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SlackService {

  constructor(
    private http: HttpClient
  ) { }

  async sendAlert(channel: string, msg: string) {
    switch (channel) {
      case 'offers': {
        const endpoint = environment.slack.offers;
        const payload = { "text": msg };

        this.http.post(endpoint, JSON.stringify(payload)).subscribe(res => {
          //console.log(res);
        });
        break;
      }
      case 'listings': {
        const endpoint = environment.slack.listings;

        const payload = { "text": msg };

        this.http.post(endpoint, JSON.stringify(payload)).subscribe(res => {
          //console.log(res);
        });
        break;
      }
      case 'others': {
        const endpoint = environment.slack.others;

        const payload = { "text": msg };

        this.http.post(endpoint, JSON.stringify(payload)).subscribe(res => {
          //console.log(res);
        });
        break;
      }
      case 'sales': {
        const endpoint = environment.slack.sales;

        const payload = { "text": msg };

        this.http.post(endpoint, JSON.stringify(payload)).subscribe(res => {
          //console.log(res);
        });
        break;
      }
      case 'requests': {
        const endpoint = environment.slack.requests;

        const payload = { "text": msg };

        return this.http.post(endpoint, JSON.stringify(payload)).subscribe((res: any) => {
          if (res.status === 200) {
            return true;
          }

          return false;
        });
      }
      case 'bugreport': {
        const endpoint = environment.slack.bugreport;

        const payload = { "text": msg };

        return this.http.post(endpoint, JSON.stringify(payload)).subscribe((res: any) => {
          if (res.status === 200) {
            return true;
          }

          return false;
        });
      }
    }
  }

}
