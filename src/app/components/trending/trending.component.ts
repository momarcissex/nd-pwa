import { Component, Input, OnInit } from '@angular/core';
import { Globals } from 'src/app/globals';
import { HomeService } from '../../services/home.service';

declare const gtag: any;
@Component({
  selector: 'app-trending',
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.scss']
})
export class TrendingComponent implements OnInit {

  trends = [];

  constructor(
    private homeService: HomeService,
    private globals: Globals
  ) { }

  ngOnInit() {
    this.homeService.getTrending().subscribe(data => {
      data.docs.forEach(ele => {
        this.trends.push(ele.data());
      });
    });
  }

  /*trackProductClick(model: string) {
    if (this.globals.exp003_version != undefined) {
      gtag('event', `${this.globals.exp003_version}_product_click`, {
        'event_category': `exp003`,
        'event_label': model
      })
    }
  }*/

}
