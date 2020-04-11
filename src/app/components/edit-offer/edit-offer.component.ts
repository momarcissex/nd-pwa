import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from 'src/app/services/profile.service';
import { OfferService } from 'src/app/services/offer.service';
import { SellService } from 'src/app/services/sell.service';
import { isUndefined } from 'util';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { Bid } from 'src/app/models/bid';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.component.html',
  styleUrls: ['./edit-offer.component.scss']
})
export class EditOfferComponent implements OnInit {

  listingID: string;

  offerInfo: Bid;

  loading = false;
  error = false;
  updated = false;

  //conditionChanged = false;
  priceChanged = false;
  sizeChanged = false;

  curCondition;
  curPrice;
  curSize;

  lowestListing: number;
  showSaveChanges = true;

  isWomen = false;
  isGS = false;

  source: string = '../../';

  constructor(
    private route: ActivatedRoute,
    private offerService: OfferService,
    private ngZone: NgZone,
    private router: Router,
    private sellService: SellService,
    private title: Title,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.listingID = this.route.snapshot.params.id;
    this.source = this.route.snapshot.queryParamMap.get('source');
    this.offerService.getOffer(this.listingID).then(val => {
      val.subscribe(data => {
        if (isUndefined(data)) {
          this.router.navigate(['page-not-found']);
        } else {
          this.offerInfo = data as Bid;
          //(document.getElementById('radio-' + this.offerInfo.condition) as HTMLInputElement).checked = true;
          this.curCondition = this.offerInfo.condition;
          this.curPrice = this.offerInfo.price;
          this.curSize = this.offerInfo.size;

          this.shoeSizes();

          this.sellService.getLowestListing(this.offerInfo.productID, this.offerInfo.condition, this.offerInfo.size).subscribe(data => {
            if (data.length > 0) {
              this.lowestListing = data[0].price
            } else {
              this.lowestListing = -1;
            }
          });

          this.title.setTitle(`Edit Offer | NXTDROP: Buy and Sell Authentic Sneakers in Canada`);
          this.meta.addTags('Edit Offer');
        }
      });
    });
  }

  private shoeSizes() {
    const patternW = new RegExp(/.\(W\)/);
    const patternGS = new RegExp(/.\(GS\)/);
    let type = 'item-size';

    console.log(this.offerInfo.model.toUpperCase());
    if (patternW.test(this.offerInfo.model.toUpperCase())) {
      //console.log(`women size`);
      this.isWomen = true;
      type = 'item-size-women';
    } else if (patternGS.test(this.offerInfo.model.toUpperCase())) {
      //console.log(`GS size`);
      this.isGS = true;
      type = 'item-size-gs';
    } else {
      type = 'item-size';
    }

    setTimeout(() => {
      (document.getElementById(type) as HTMLInputElement).value = this.offerInfo.size;
    }, 500);
  }

  /*conditionChanges($event) {
    if (this.offerInfo.condition != $event.target.value && this.conditionChanged == false) {
      this.conditionChanged = true;
    } else if (this.offerInfo.condition == $event.target.value && this.conditionChanged == true) {
      this.conditionChanged = false;
    }

    this.curCondition = $event.target.value;
  }*/

  priceChanges($event) {
    if ($event.target.value != '' && +$event.target.value >= 40) {
      if (this.offerInfo.price != $event.target.value && this.priceChanged == false) {
        this.priceChanged = true;
      } else if ((this.offerInfo.price == $event.target.value) && this.priceChanged == true) {
        this.priceChanged = false;
      }
    } else {
      this.priceChanged = false;
    }

    this.curPrice = +$event.target.value;

    this.showSaveChangesBtn();
  }

  sizeChanges($event) {
    if (this.offerInfo.size != $event.target.value && this.sizeChanged == false) {
      this.sizeChanged = true;
    } else if (this.offerInfo.size == $event.target.value && this.sizeChanged == true) {
      this.sizeChanged = false;
    }

    this.curSize = $event.target.value;
  }

  updateOffer() {
    const condition = 'new';
    const price = this.curPrice;
    const size = this.curSize;

    if (this.priceChanged || this.sizeChanged) {
      this.loading = true;

      if (isNaN(price)) {
        this.updateError();
        return;
      }

      this.offerService.updateOffer(this.offerInfo.offerID, this.offerInfo.productID, this.offerInfo.price, condition, price, size).then(res => {
        if (res) {
          this.udpateSuccessful();
        } else {
          this.updateError();
        }
      })
    }
  }

  deleteOffer() {
    this.offerService.deleteoffer(this.offerInfo.offerID, this.offerInfo.productID, this.offerInfo.price)
      .then((res) => {
        if (res) {
          return this.ngZone.run(() => {
            return this.router.navigate(['../../profile']);
          });
        }
      });
  }

  updateError() {
    this.loading = false;
    this.error = true;

    setTimeout(() => {
      this.error = false;
    }, 2500);
  }

  udpateSuccessful() {
    this.loading = false;
    this.updated = true;

    setTimeout(() => {
      this.updated = false;
      //this.conditionChanged = false;
      this.priceChanged = false;
      this.sizeChanged = false;
    }, 2500);
  }

  showSaveChangesBtn() {
    if (this.curPrice >= this.lowestListing) {
      if (this.lowestListing != -1) {
        this.showSaveChanges = false;
      } else {
        this.showSaveChanges = true;
      }
    } else {
      if (this.lowestListing != -1) {
        this.showSaveChanges = true;
      } else {
        this.showSaveChanges = true;
      }
    }
  }

}
