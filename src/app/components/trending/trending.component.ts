import { Component, OnInit } from '@angular/core';
import { HomeService } from '../../services/home.service';
import { Product } from 'src/app/models/product';

@Component({
  selector: 'app-trending',
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.scss']
})
export class TrendingComponent implements OnInit {

  trends: Product[];

  constructor(
    private homeService: HomeService
  ) { }

  ngOnInit() {
    this.homeService.getTrending().subscribe(data => this.trends = data);
  }

}
