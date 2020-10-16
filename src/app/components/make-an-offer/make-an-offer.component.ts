import { Component, OnInit, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { isUndefined, isNull, isNullOrUndefined } from 'util';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from 'src/app/models/product';
import { AuthService } from 'src/app/services/auth.service';
import { Title } from '@angular/platform-browser';
import { SlackService } from 'src/app/services/slack.service';
import { isPlatformBrowser } from '@angular/common';
import { MetaService } from 'src/app/services/meta.service';
import * as algoliasearch from 'algoliasearch';
import { environment } from 'src/environments/environment';
import { Ask } from 'src/app/models/ask';
import { Bid } from 'src/app/models/bid';
import { AskService } from 'src/app/services/ask.service';
import { BidService } from 'src/app/services/bid.service';
import { User } from 'firebase';
import { response } from 'express';
import { faBox, faCircleNotch, faHandHoldingUsd, faShippingFast } from '@fortawesome/free-solid-svg-icons';

declare var gtag: any;

@Component({
  selector: 'app-make-an-offer',
  templateUrl: './make-an-offer.component.html',
  styleUrls: ['./make-an-offer.component.scss']
})
export class MakeAnOfferComponent implements OnInit {

  faHandHoldingUsd = faHandHoldingUsd
  faShippingFast = faShippingFast
  faCircleNotch = faCircleNotch
  faBox = faBox

  // Algolia Set up
  algoliaClient = algoliasearch(environment.algolia.appId, environment.algolia.apiKey)
  index
  results
  inputLength = 0 // Length of search box input
  showResults = false

  //Size Setup
  default_sizes: { [key: string]: string[] } = {
    'M': ['US3', 'US3.5', 'US4', 'US4.5', 'US5', 'US5.5', 'US6', 'US6.5', 'US7', 'US7.5', 'US8', 'US8.5', 'US9', 'US9.5', 'US10', 'US10.5', 'US11', 'US11.5', 'US12', 'US12.5', 'US13', 'US13.5', 'US14', 'US14.5', 'US15', 'US15.5', 'US16', 'US16.5', 'US17', 'US18'],
    'Y': ['US3Y', 'US3.5Y', 'US4Y', 'US4.5Y', 'US5Y', 'US5.5Y', 'US6Y', 'US6.5Y', 'US7Y'],
    'W': ['US4W', 'US4.5', 'US5W', 'US5.5W', 'US6W', 'US6.5W', 'US7W', 'US7.5W', 'US8W', 'US8.5W', 'US9W', 'US9.5W', 'US10W', 'US10.5W', 'US11W', 'US11.5W', 'US12W', 'US12.5W', 'US13W', 'US13.5W', 'US14W', 'US14.5W', 'US15W', 'US15.5W', 'US16W', 'US16.5W']
  } //default sizes
  sizeType: string = 'M'
  sizeSuffix: string = ''

  offers = []

  //Pages Boolean
  showHowItWorks: boolean = true
  showSearch: boolean = false
  showItem: boolean = false

  // Offer Information
  pairCondition: string
  pairPrice: number
  pairSize: string

  selectedPair: Product // Listing Product object
  selectedSize: string = ''

  HighestBid: any = NaN
  LowestAsk: any = NaN
  currentBid: any = NaN
  currentAsk: any = NaN

  priceAdded = false

  error: boolean
  listed: boolean
  loading: boolean

  user: User

  shippingCost: number = 15
  total: number = 0

  userBid: Bid

  // user check agreement
  willCheckout: boolean = false

  expiration_date: number = Date.now() + (86400000 * 30) //bid expiration date

  constructor(
    private askService: AskService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private bidService: BidService,
    private ngZone: NgZone,
    private auth: AuthService,
    private title: Title,
    private slack: SlackService,
    @Inject(PLATFORM_ID) private _platformId: Object,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Make an Offer | NXTDROP: Buy and Sell Sneakers in Canada`);
    this.meta.addTags('Make an Offer');

    this.index = this.algoliaClient.initIndex(environment.algolia.index);

    this.auth.isConnected().then(res => {
      if (!isNull(res)) {
        this.user = res;
      }

      this.activatedRoute.queryParams.subscribe(params => {
        if (!isUndefined(params.sneaker)) {
          this.selectPair(JSON.parse(params.sneaker), false);

          if (!isNullOrUndefined(params.size)) {
            this.selectSize(params.size);
          }
        }
      });
    });
  }

  searchChanged(event) {
    this.inputLength = event.target.value.length;

    if (this.inputLength) {
      this.showResults = true;

      //console.log(event.target.value);

      this.index.search({
        query: event.target.value
      }, (err, hits: any = {}) => {
        if (err) throw err;

        this.results = hits.hits;
        //console.log(hits);
      });
    } else {
      this.showResults = false;
    }
  }

  selectPair(pair: Product, updateURL: boolean) {
    this.selectedPair = pair

    const patternW = new RegExp(/.\(W\)/);
    const patternGS = new RegExp(/.\(GS\)/);

    //console.log(pair.model.toUpperCase());
    if (patternW.test(pair.model.toUpperCase())) {
      //console.log('Woman Size');
      this.sizeSuffix = 'W';
      this.sizeType = 'W';
    } else if (patternGS.test(pair.model.toUpperCase())) {
      //console.log(`GS size`);
      this.sizeSuffix = 'Y';
      this.sizeType = 'GS';
    } else {
      this.sizeType = 'M';
    }

    if (updateURL) {
      this.router.navigate([], {
        queryParams: { sneaker: JSON.stringify(this.selectedPair) }
      }).then(() => {
        this.goToItemPage();
      })
    }
  }

  getOffers() {
    let shoeSizes: Array<string>

    if (!isNullOrUndefined(this.selectedPair.sizes)) {
      shoeSizes = this.selectedPair.sizes
    } else {
      shoeSizes = this.default_sizes[this.sizeType]
    }

    shoeSizes.forEach(ele => {
      let ask: any;
      const size = ele

      this.askService.getLowestAsk(this.selectedPair.productID, 'new', size).then(askdata => {
        askdata.empty ? ask = undefined : ask = askdata.docs[0].data() as Ask

        const data = {
          LowestAsk: ask,
          size: size
        }

        this.offers.push(data);

        if (shoeSizes.length === this.offers.length) {
          this.getProductStats();
        }
      });
    });
  }

  getProductStats() {
    this.askService.getLowestAsk(this.selectedPair.productID, 'new').then(response => {
      response.empty ? this.LowestAsk = undefined : this.LowestAsk = response.docs[0].data() as Ask;

      this.askService.getLowestAsk(this.selectedPair.productID, 'new').then(res => {
        res.empty ? this.HighestBid = undefined : this.HighestBid = res.docs[0].data() as Bid

        if (!this.selectedSize) {
          this.currentAsk = this.LowestAsk;
          this.currentBid = this.HighestBid;
        }
      });
    });
  }

  private getPrice() {
    const price = (document.getElementById('input') as HTMLInputElement).value;
    return +price;
  }

  addError() {
    this.loading = false;
    this.error = true;

    setTimeout(() => {
      this.error = false;
    }, 2500);
  }

  addListed() {
    this.loading = false;
    this.listed = true;
  }

  nextPage() {
    if (isNullOrUndefined(this.selectedPair)) {
      this.showHowItWorks = false;
      this.showSearch = true;
    } else {
      this.goToItemPage();
    }
  }

  goToItemPage() {
    this.showSearch = false;
    this.showHowItWorks = false;
    this.showItem = true;

    this.getOffers();
  }

  submitOffer() {
    this.pairPrice = this.getPrice();
    this.pairSize = this.selectedSize;
    this.loading = true;

    if (isNaN(this.pairPrice) || !this.willCheckout) {
      this.addError();
      return;
    } else if (isNullOrUndefined(this.user)) {
      this.router.navigate(['/login'], {
        queryParams: {
          redirectTo: this.router.url
        }
      })
      return;
    }

    if (isNullOrUndefined(this.userBid)) {
      this.bidService.submitBid(this.user.uid, this.selectedPair, 'new', this.pairPrice, this.pairSize, this.currentBid.price, this.expiration_date).then(res => {
        if (res) {
          if (isPlatformBrowser(this._platformId)) {
            gtag('event', 'bid', {
              'event_category': 'engagement',
              'event_label': this.selectedPair.model,
              'event_value': this.pairPrice
            });
          }

          const msg = `${this.user.uid} placed an offer for ${this.selectedPair.model}, size ${this.pairSize} at ${this.pairPrice}`;
          this.slack.sendAlert('offers', msg);

          this.addListed();
        } else {
          this.addError();
        }
      })
    } else {
      this.bidService.extendBid(this.userBid).then(
        res => {
          if (res) {
            this.bidService.updateBid(this.userBid, this.pairPrice, this.expiration_date)
              .then(response => {
                if (response) {
                  this.addListed()
                } else {
                  this.addError()
                }
              })
          }
        }
      )
    }
  }

  priceChanges($event) {
    if ($event.target.value != `` && +$event.target.value >= 40) {
      this.priceAdded = true;
      this.pairPrice = +$event.target.value;

      this.calculateTotal();
    } else {
      this.priceAdded = false;
      this.pairPrice = NaN;
    }
  }

  calculateTotal() {
    this.total = this.shippingCost + this.pairPrice;
  }

  buyNow() {
    this.ngZone.run(() => {
      this.router.navigate([`../../checkout`], {
        queryParams: { product: this.currentAsk.listingID, sell: false }
      });
    });
  }

  selectSize(size: string) {
    this.selectedSize = size;
    this.userBid = undefined

    this.bidService.getHighestBid(this.selectedPair.productID, 'new', this.selectedSize).then(res => {
      if (res.empty) {
        this.currentBid = NaN;
      } else {
        this.currentBid = res.docs[0].data() as Bid
      }
    });

    this.askService.getLowestAsk(this.selectedPair.productID, 'new', this.selectedSize).then(res => {
      if (res.empty) {
        this.currentAsk = NaN;
      } else {
        this.currentAsk = res.docs[0].data() as Ask
      }
    });

    if (!isNullOrUndefined(this.user)) {
      this.bidService.checkUserBid(this.selectedPair.productID, this.selectedSize, this.user.uid, 'new').subscribe(response => {
        if (response.length > 0) {
          this.userBid = response[0]
        }
      })
    }
  }

  changeSize() {
    this.selectedSize = '';
    this.currentBid = this.HighestBid;
    this.currentAsk = this.LowestAsk;
    this.priceAdded = false;
    this.pairPrice = NaN;
    this.shippingCost = 0;
    this.total = 0;
  }

  agreementsCheckbox(mode: string) {
    if (mode === 'checkout') {
      this.willCheckout = !this.willCheckout
    }
  }

  finish() {
    return this.ngZone.run(() => {
      return this.router.navigate([`/product/${this.selectedPair.productID}`]);
    });
  }

}
