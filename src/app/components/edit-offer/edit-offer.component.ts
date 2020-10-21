import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { Bid } from 'src/app/models/bid';
import { Ask } from 'src/app/models/ask';
import { BidService } from 'src/app/services/bid.service';
import { AskService } from 'src/app/services/ask.service';
import { faCheck, faCircleNotch, faDollarSign } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.component.html',
  styleUrls: ['./edit-offer.component.scss']
})
export class EditOfferComponent implements OnInit {

  faCircleNotch = faCircleNotch
  faDollarSign = faDollarSign
  faCheck = faCheck

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

  lowest_ask: Ask;
  showSaveChanges = true;

  isWomen = false;
  isGS = false;

  source: string = '../../';

  shipping_cost: number = 15

  expiration_date: number = Date.now() + (86400000 * 30) //bid expiration date

  constructor(
    private route: ActivatedRoute,
    private bidService: BidService,
    private askService: AskService,
    private ngZone: NgZone,
    private router: Router,
    private title: Title,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.listingID = this.route.snapshot.params.id;
    this.source = this.route.snapshot.queryParamMap.get('source');
    this.bidService.getBid(this.listingID).subscribe(data => {
      if (data === undefined) {
        this.router.navigate(['page-not-found']);
      } else {
        this.offerInfo = data;
        //(document.getElementById('radio-' + this.offerInfo.condition) as HTMLInputElement).checked = true;
        this.curCondition = this.offerInfo.condition;
        this.curPrice = this.offerInfo.price;
        this.curSize = this.offerInfo.size;

        this.shoeSizes();

        this.askService.getLowestAsk(this.offerInfo.productID, this.offerInfo.condition, this.offerInfo.size).then(data => {
          if (!data.empty) {
            this.lowest_ask = data.docs[0].data() as Ask
          }
        });

        this.title.setTitle(`Edit Offer | NXTDROP: Buy and Sell Authentic Sneakers in Canada`);
        this.meta.addTags('Edit Offer');
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

      this.bidService.updateBid(this.offerInfo, price, this.expiration_date).then(res => {
        if (res) {
          this.udpateSuccessful();
        } else {
          this.updateError();
        }
      })
    }
  }

  deleteOffer() {
    this.bidService.deleteBid(this.offerInfo)
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
    if (this.lowest_ask === undefined) {
      this.showSaveChanges = true
    } else {
      if (this.curPrice >= this.lowest_ask.price) {
        this.showSaveChanges = false
      } else {
        this.showSaveChanges = true
      }
    }
  }

  buyNow() {
    this.router.navigate(['/checkout'], {
      queryParams: {
        product: this.lowest_ask.listingID,
        sell: false,
        redirectTo: this.router.url
      }
    })
  }

  back() {
    this.router.navigateByUrl(this.source)
  }

}
