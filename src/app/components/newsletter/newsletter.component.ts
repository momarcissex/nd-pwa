import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { faCheck, faCircleNotch, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterComponent implements OnInit {

  faCircleNotch = faCircleNotch
  faCheck = faCheck
  faExclamationCircle = faExclamationCircle

  error: boolean = false;
  loading: boolean = false;
  subscribed: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private _platformId: Object,
    private http: HttpClient
  ) { }

  ngOnInit() {
  }

  subscribe() {
    this.loading = true;
    this.error = false;

    if (isPlatformBrowser(this._platformId)) {
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const regex = RegExp('^.+@.+\.[a-z]{2,5}$');

      if (regex.test(email)) {
        this.http.put(`${environment.cloud.url}addToNewsletter`, { email: email }).subscribe(res => {
          if (res) {
            this.loading = false;
            this.subscribed = true;

            this.reset()
          } else {
            this.loading = false;
            this.error = true;
          }
        });
      } else {
        this.error = true;
        this.loading = false;
      }
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  reset() {
    setTimeout(() => {
      this.subscribed = false;
    }, 2000)
  }

}
