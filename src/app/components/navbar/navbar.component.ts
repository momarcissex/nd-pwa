import { Component, OnInit, NgZone, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { NotificationsComponent } from '../notifications/notifications.component';
import { AuthService } from '../../services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { faTimes, faSearch, faBars } from '@fortawesome/free-solid-svg-icons';

@Component({
  providers: [NotificationsComponent],
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  isMobile: boolean = false;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event.target.innerWidth < 768) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  connected: boolean;
  showSearchBar: boolean = false;

  typingTimer;
  doneTypingInterval = 1000;

  userInfo = {};

  faBars = faBars
  faTimes = faTimes
  faSearch = faSearch

  constructor(
    private notification: NotificationsComponent,
    private auth: AuthService,
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) { }

  ngOnInit() {
    this.auth.isConnected().then(res => {
      if (res) {
        this.connected = true;
      } else {
        this.connected = false;
      }
    })

    this.checkWidth();

    const url = this.route.snapshot.url;
    //console.log(url)

    if (url.length > 0 && !this.isMobile) {
      if (url[0].path === 'search' || url[0].path === 'home') {
        this.showSearchBar = false;
      } else {
        this.showSearchBar = true;
      }
    } else {
      this.showSearchBar = false;
    }
  }

  openMenu() {
    // console.log('open');
    const element = document.getElementById('slide-menu');
    element.style.width = '100vw';
    document.body.style.overflow = 'hidden'
  }

  checkUser() {
    return this.auth.isConnected().then(res => {
      if (res != undefined) {
        return this.afs.collection(`users`).doc(`${res.uid}`).ref.get().then(docSnapshot => {
          if (!docSnapshot.exists) {
            res.delete();
            return false;
          } else {
            return true;
          }
        });
      }
    })
  }

  public openNotificationTab(): void {
    // console.log('open');
    this.notification.notificationDisplay();
  }

  search(event) {
    clearTimeout(this.typingTimer);
    if (event.target.value) {
      this.typingTimer = setTimeout(() => {
        return this.ngZone.run(() => {
          return this.router.navigate(['../search'], {
            queryParams: { q: event.target.value }
          });
        });
      }, this.doneTypingInterval);
    }
  }

  checkWidth() {
    if (isPlatformBrowser(this._platformId)) {
      if (window.innerWidth < 768) {
        this.isMobile = true;
      } else {
        this.isMobile = false;
      }
    }
  }

  openSearch() {
    this.showSearchBar = !this.showSearchBar;
  }
}
