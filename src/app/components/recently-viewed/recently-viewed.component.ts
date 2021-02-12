import { Component, OnInit } from '@angular/core';
import { Globals } from 'src/app/globals';
import { Product } from 'src/app/models/product';
import { ProductService } from 'src/app/services/product.service';

declare const gtag: any;
@Component({
  selector: 'app-recently-viewed',
  templateUrl: './recently-viewed.component.html',
  styleUrls: ['./recently-viewed.component.scss']
})
export class RecentlyViewedComponent implements OnInit {

  recently_viewed: Product[] = []

  /**
   * RecentlyViewedComponent Constructor
   */
  constructor(
    private globals: Globals,
    private product_service: ProductService
  ) { }

  /**
   * ngOnInit function
   */
  ngOnInit(): void {
    this.getRecentlyViewed()
  }

  /**
   * Get users recently viewed items 
   */
  private getRecentlyViewed(): void {
    if (this.globals.user_data != undefined) {
      if (this.globals.user_data.recently_viewed != undefined) {
        this.globals.user_data.recently_viewed.forEach(product_id => {
          this.product_service.getProductInfo(product_id).subscribe(res => {
            this.recently_viewed.push(res)
          },
          err => {
            console.error(err)
          })
        })
      }
    }
  }

  /**
   * Track click on product with Google Analytics and update Globals.recently_viewed_clicks for conversion
   */
  public clickTracking(product_id: string): void {
    this.globals.recently_viewed_clicks.push(product_id)

    gtag('event', 'product_click', {
      'event_category': 'exp004',
      'event_label': product_id
    })
  }

}
