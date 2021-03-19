import { Component, OnInit } from '@angular/core';
import { Product } from 'src/app/models/product';
import { HomeService } from 'src/app/services/home.service';

declare const gtag: any;
@Component({
  selector: 'app-upcoming-releases',
  templateUrl: './upcoming-releases.component.html',
  styleUrls: ['./upcoming-releases.component.scss']
})
export class UpcomingReleasesComponent implements OnInit {

  upcoming_releases: Product[] = []

  /**
   * @constructor
   * @param home_service initializes service that has access to products
   */
  constructor(
    private home_service: HomeService
  ) { }

  /**
   * Called after Angular initializes component
   * Put any additional initialization tasks
   */
  ngOnInit(): void {
    this.getUpcomingReleases()
  }

  /**
   * Gets all upcoming releases and assigns them to variable upcoming_releases
   */
  private getUpcomingReleases(): void {
    this.home_service.getUpcomingReleases().subscribe(res => {
      res.docs.forEach(ele => {
        this.upcoming_releases.push(ele.data() as Product)
      })
    },
    err => {
      console.error(err)
    })
  }

  /**
   * Send click event to Google Analytics
   * @param product_id ID of the product the user clicked on
   */
  /*public track(product_id: string): void {
    gtag('event', 'upcoming_release_click', {
      'event_category': 'engagement',
      'event_label': product_id
    })
  }*/

}
