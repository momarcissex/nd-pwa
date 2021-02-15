import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AngularFirestore } from '@angular/fire/firestore';
import { MetaService } from 'src/app/services/meta.service';
import { User } from 'src/app/models/user';
import { Globals } from 'src/app/globals';

declare const gtag: any;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  connected: boolean = false;
  lastSale: any;

  userInfo: User;

  loadIframe: boolean = true

  exp003: boolean[] = [false, false, false, false, false, false]
  config: string = ''

  constructor(
    private title: Title,
    private afs: AngularFirestore,
    private seo: MetaService,
    public globals: Globals
  ) { }

  ngOnInit() {
    this.title.setTitle(`NXTDROP: Buy and Sell Sneakers in Canada`);
    this.seo.addTags('Home');

    this.userInfo = this.globals.user_data
    if (this.globals.uid != undefined) this.connected = true

    if (this.globals.exp003_version == 'config1') {
      gtag('event', `exp003_view`, {
        'event_category': `exp003_${this.globals.exp003_version}`
      })
    } else if (this.globals.exp003_version == 'config2') {
      gtag('event', `exp003_view`, {
        'event_category': `exp003_${this.globals.exp003_version}`
      })
    } else if (this.globals.exp003_version == 'config3') {
      gtag('event', `exp003_view`, {
        'event_category': `exp003_${this.globals.exp003_version}`
      })
    } else if (this.globals.exp003_version == 'config4') {
      gtag('event', `exp003_view`, {
        'event_category': `exp003_${this.globals.exp003_version}`
      })
    } else if (this.globals.exp003_version == 'config5') {
      gtag('event', `exp003_view`, {
        'event_category': `exp003_${this.globals.exp003_version}`
      })
    } else if (this.globals.exp003_version == 'config6') {
      gtag('event', `exp003_view`, {
        'event_category': `exp003_${this.globals.exp003_version}`
      })
    }

    this.afs.collection(`transactions`, ref => ref.where('status.cancelled', '==', false).orderBy(`purchaseDate`, `desc`).limit(1)).valueChanges().subscribe(res => {
      res.forEach(ele => {
        this.lastSale = ele;
      });
    });
  }
}
