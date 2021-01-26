import { Component, Input, OnInit } from '@angular/core';
import { HomeService } from '../../services/home.service';

@Component({
  selector: 'app-new-releases',
  templateUrl: './new-releases.component.html',
  styleUrls: ['./new-releases.component.scss']
})
export class NewReleasesComponent implements OnInit {

  newReleases = [];

  @Input() configuration: string;

  constructor(
    private homeService: HomeService
  ) { }

  ngOnInit() {
    this.homeService.getNewReleases().subscribe(res => {
      res.docs.forEach(element => {
          this.newReleases.push(element.data());
      })
    })
  }

}
