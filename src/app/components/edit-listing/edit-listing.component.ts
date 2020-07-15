import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isUndefined, isNullOrUndefined } from 'util';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { Ask } from 'src/app/models/ask';
import { Bid } from 'src/app/models/bid';
import { AskService } from 'src/app/services/ask.service';
import { BidService } from 'src/app/services/bid.service';

@Component({
  selector: 'app-edit-listing',
  templateUrl: './edit-listing.component.html',
  styleUrls: ['./edit-listing.component.scss']
})
export class EditListingComponent implements OnInit {

  listingID: string;

  offerInfo: Ask;

  loading = false;
  error = false;
  updated = false;

  //conditionChanged = false;
  priceChanged = false;
  sizeChanged = false;
  showSaveChanges: boolean = true;

  highestOffer: Bid;
  lowest_ask: number;

  curCondition;
  curPrice;
  curSize;

  isWomen = false;
  isGS = false;

  consignmentFee = 0;
  paymentProcessingFee = 0;
  payout = 0;

  source: string = '../../';

  expiration_date: number = Date.now() + (86400000 * 30) //ask's expiration date

  constructor(
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private router: Router,
    private askService: AskService,
    private bidService: BidService,
    private title: Title,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle('Edit Listing | NXTDROP: Sell and Buy Authentic Sneakers in Canada');
    this.meta.addTags('Edit Listing');

    this.listingID = this.route.snapshot.params.id;
    this.source = this.route.snapshot.queryParamMap.get('source');
    this.askService.getAsk(this.listingID).subscribe(data => {
      if (isUndefined(data)) {
        this.router.navigate([`page-not-found`]);
      } else {
        this.offerInfo = data;
        //(document.getElementById('radio-' + this.offerInfo.condition) as HTMLInputElement).checked = true;
        this.curCondition = this.offerInfo.condition;
        this.curPrice = this.offerInfo.price;
        this.curSize = this.offerInfo.size;

        this.shoeSizes();
        this.calculateSellerFees();

        this.bidService.getHighestBid(this.offerInfo.productID, this.offerInfo.condition, this.offerInfo.size).then(data => {
          if (!data.empty) {
            this.highestOffer = data.docs[0].data() as Bid
          }
        });

        this.askService.getLowestAsk(this.offerInfo.productID, this.offerInfo.condition, this.offerInfo.size).then(data => {
          if (!data.empty) {
            this.lowest_ask = data.docs[0].data().price
          }
        })
      }
    });
  }

  private shoeSizes() {
    const patternW = new RegExp(/.\(W\)/);
    const patternGS = new RegExp(/.\(GS\)/);
    let type = 'item-size';

    //console.log(this.offerInfo.model.toUpperCase());
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

    this.calculateSellerFees();
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

  private calculateSellerFees() {
    this.consignmentFee = this.curPrice * 0.085;
    this.paymentProcessingFee = this.curPrice * 0.03;
    this.payout = this.curPrice - this.consignmentFee - this.paymentProcessingFee;
  }

  updateListing() {
    const condition = 'new';
    const price = this.curPrice;
    const size = this.curSize;

    if (this.priceChanged || this.sizeChanged) {
      this.loading = true;

      if (isNaN(price)) {
        this.updateError();
        return;
      }

      this.askService.updateAsk(this.offerInfo, price, this.expiration_date).then((res) => {
        if (res) {
          this.udpateSuccessful();
        } else {
          this.updateError();
        }
      });
    }
  }

  deleteListing() {
    this.askService.deleteAsk(this.offerInfo)
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
    if (isNullOrUndefined(this.highestOffer)) {
      this.showSaveChanges = true
    } else {
      if (this.curPrice <= this.highestOffer.price) {
        this.showSaveChanges = false
      } else {
        this.showSaveChanges = true
      }
    }
  }

  sellNow() {
    this.router.navigate(['/checkout'], {
      queryParams: {
        product: this.highestOffer.offerID,
        sell: true,
        redirectTo: this.router.url
      }
    })
  }

  back() {
    this.router.navigateByUrl(this.source)
  }

}
