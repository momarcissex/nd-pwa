import { Component, OnInit } from '@angular/core';
import { Globals } from 'src/app/globals';
import { HomeService } from '../../services/home.service';

declare const gtag: any;
@Component({
  selector: 'app-new-releases',
  templateUrl: './new-releases.component.html',
  styleUrls: ['./new-releases.component.scss']
})
export class NewReleasesComponent implements OnInit {

  newReleases = [];

  constructor(
    private homeService: HomeService,
    private globals: Globals
  ) { }

  ngOnInit() {
    this.homeService.getNewReleases().subscribe(res => {
      res.docs.forEach(element => {
        this.newReleases.push(element.data());
      })
    })
  }

  trackProductClick(model: string) {
    console.log('work')
    if (this.globals.exp003_version != undefined) {
      gtag('event', `${this.globals.exp003_version}_product_click`, {
        'event_category': `exp003`,
        'event_label': model
      })
    }
  }

}
