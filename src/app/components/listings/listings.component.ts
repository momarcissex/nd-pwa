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
        if (ask.seller_id != 'zNSB9cdIPTZykSJv7xCoTeueFmk2' && ask.seller_id != 'eOoTdK5Z8IYbbHq7uOc9y8gis5h1' && this.latestAsks.length < 100) {
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

  /*getDiscount(price: number) {
    if (price >= 100 && price < 200) {
      return price - 15
    } else if (price >= 200 && price < 300) {
      return price - 16
    } else if (price >= 300 && price < 400) {
      return price - 17
    } else if (price >= 400 && price < 500) {
      return price - 18
    } else if (price >= 500 && price < 800) {
      return price * .94
    } else if (price >= 800) {
      return price * .95
    }
  }*/

}
