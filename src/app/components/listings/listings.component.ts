import { Component, Input, OnInit } from '@angular/core';
import { Globals } from 'src/app/globals';
import { HomeService } from 'src/app/services/home.service';

declare const gtag: any;
@Component({
  selector: 'app-listings',
  templateUrl: './listings.component.html',
  styleUrls: ['./listings.component.scss']
})
export class ListingsComponent implements OnInit {

  latestAsks = [];

  constructor(
    private homeService: HomeService,
    private globals: Globals
  ) { }

  ngOnInit() {
    this.homeService.getLatestAsk().subscribe(asks => {
      asks.forEach(ask => {
        if (ask.sellerID != 'zNSB9cdIPTZykSJv7xCoTeueFmk2' && ask.sellerID != 'eOoTdK5Z8IYbbHq7uOc9y8gis5h1' && this.latestAsks.length < 100) {
          this.latestAsks.push(ask)
        }
      })
    },
      err => {
        console.error(err)
      })
  }

  track(productID: string) {
    //console.log('work')
    //console.log(this.globals.exp003_version)
    if (this.globals.exp003_version != undefined) {
      gtag('event', `${this.globals.exp003_version}_listing_click`, {
        'event_category': `exp003`,
        'event_label': productID
      })
    }
  }

}
