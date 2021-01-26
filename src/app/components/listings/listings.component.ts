import { Component, Input, OnInit } from '@angular/core';
import { HomeService } from 'src/app/services/home.service';

@Component({
  selector: 'app-listings',
  templateUrl: './listings.component.html',
  styleUrls: ['./listings.component.scss']
})
export class ListingsComponent implements OnInit {

  latestAsks = [];

  @Input() configuration: string;

  constructor(
    private homeService: HomeService
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

}
