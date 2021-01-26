import { Component, Input, OnInit } from '@angular/core';
import { HomeService } from '../../services/home.service';

@Component({
  selector: 'app-trending',
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.scss']
})
export class TrendingComponent implements OnInit {

  trends = [];

  @Input() configuration: string;

  constructor(
    private homeService: HomeService
  ) { }

  ngOnInit() {
    this.homeService.getTrending().subscribe(data => {
      data.docs.forEach(ele => {
        this.trends.push(ele.data());
      });
    });
  }

}
