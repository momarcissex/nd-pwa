import { Component, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { MetaService } from './services/meta.service';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { isNullOrUndefined } from 'util';
import { IpService } from './services/ip.service';

declare const gtag: any;
declare const fbq: any;

declare global {
  interface Window { Intercom: any; }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  constructor(
    private router: Router,
    private auth: AuthService,
    private seo: MetaService,
    private http: HttpClient,
    private ipService: IpService,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) { }

  ngAfterViewInit() {
    const navEndEvents = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    );

    if (isPlatformBrowser(this._platformId)) {
      window.Intercom = window.Intercom || {};
      this.auth.isConnected().then(res => {
        if (!isNullOrUndefined(res)) {
          gtag('set', { 'user_id': res.uid }); // Set the user ID using signed-in user_id.
          fbq('init', '247312712881625', { uid: res.uid });
          this.ipService.getIPAddress().subscribe((data: any) => {
            this.auth.updateLastActivity(res.uid, data.ip);
          })

          this.http.put(`${environment.cloud.url}IntercomData`, { uid: res.uid }).subscribe((data: any) => {
            //console.log(data)
            window.Intercom("boot", {
              app_id: "w1p7ooc8",
              name: `${data.firstName} ${data.lastName}`, // Full name
              email: res.email, // Email address
              created_at: res.metadata.creationTime, // Signup date as a Unix timestamp
              user_id: res.uid,
              user_hash: data.hash
            });
          });
        } else {
          fbq('init', '247312712881625');
          window.Intercom("boot", {
            app_id: "w1p7ooc8"
          });
        }
      }).catch(err => {
        console.error(err);
      })
    }

    navEndEvents.subscribe((event: NavigationEnd) => {
      if (isPlatformBrowser(this._platformId)) {
        (<any>window).gtag('config', 'UA-148418496-1', {
          'page_path': event.urlAfterRedirects
        });
        fbq('track', 'PageView');
        window.Intercom("update");

        this.auth.isConnected().then(res => {
          if (!isNullOrUndefined(res)) {
            const pattern = new RegExp(/^\/additional-information($|\?.*$)/gm)
            //console.log(this.router.url)
            //console.log(pattern.test(this.router.url))
            if (res.providerData[0].providerId == 'google.com' && res.providerData.length === 1 && !pattern.test(this.router.url)) {
              this.auth.signOut(false)
            }
          }
        })
      }
      this.seo.createCanonicalLink();
      this.seo.removeTags()
    });
  }

}
