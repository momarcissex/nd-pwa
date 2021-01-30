import { Component, OnInit } from '@angular/core';
import { Globals } from 'src/app/globals';
import { Product } from 'src/app/models/product';
import { ProductService } from 'src/app/services/product.service';

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
   * Track click on product with Google Analytics
   */
  public googAnalyticsTracking(): void {
  }

}
