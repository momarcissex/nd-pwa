import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent implements OnInit, OnDestroy {

  connected: boolean;

  faTimes = faTimes

  constructor(
    private auth: AuthService,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) { }

  ngOnInit() {
    this.auth.checkStatus().then(value => {
      this.connected = value;
    });
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this._platformId)) {
      document.body.style.overflow = 'auto'
    }
  }

  closeMenu() {
    // console.log('work');
    const element = document.getElementById('slide-menu');
    element.style.width = '0vw';
    document.body.style.overflow = 'auto'
  }
}
