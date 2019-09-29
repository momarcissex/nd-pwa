import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { SEOService } from './services/seo.service';

declare var gtag: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    router: Router,
    auth: AuthService,
    seo: SEOService
  ) {
    const navEndEvents = router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    );

    auth.isConnected().then(res => {
      gtag('set', { 'user_id': res.uid }); // Set the user ID using signed-in user_id.
    })

    navEndEvents.subscribe((event: NavigationEnd) => {
      const pattern = new RegExp('^\/product\/.+$');
      if (!pattern.test(event.urlAfterRedirects)) {
        seo.addTags();
      }

      gtag('config', 'UA-148418496-1', {
        'page_path': event.urlAfterRedirects
      });
    });
  }

}
