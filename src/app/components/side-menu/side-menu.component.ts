import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent implements OnInit, OnDestroy {

  connected: boolean;

  constructor(
    private auth: AuthService
  ) { }

  ngOnInit() {
    this.auth.checkStatus().then(value => {
      this.connected = value;
    });
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto'
  }

  closeMenu() {
    // console.log('work');
    const element = document.getElementById('slide-menu');
    element.style.width = '0vw';
    document.body.style.overflow = 'auto'
  }
}
