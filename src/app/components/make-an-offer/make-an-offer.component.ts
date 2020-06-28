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

declare var gtag: any;

@Component({
  selector: 'app-make-an-offer',
  templateUrl: './make-an-offer.component.html',
  styleUrls: ['./make-an-offer.component.scss']
})
export class MakeAnOfferComponent implements OnInit {

  // Algolia Set up
  algoliaClient = algoliasearch(environment.algolia.appId, environment.algolia.apiKey)
  index
  results
  inputLength = 0 // Length of search box input
  showResults = false

  //Size Setup
  default_sizes: { [keys: string]: number[] } = {
    "M": [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 18],
    "W": [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5],
    "GS": [3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7]
  }
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

  willCheckout: boolean = false

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
    let shoeSizes: Array<number>

    if (!isNullOrUndefined(this.selectedPair.sizes)) {
      shoeSizes = this.selectedPair.sizes
    } else {
      shoeSizes = this.default_sizes[this.sizeType]
    }

    shoeSizes.forEach(ele => {
      let ask: any;
      const size = `US${ele}${this.sizeSuffix}`;

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
    }

    if (isNullOrUndefined(this.userBid)) {
      this.bidService.submitBid(this.selectedPair, 'new', this.pairPrice, this.pairSize, this.currentBid.price).then(res => {
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
      this.bidService.updateBid(this.userBid.offerID, this.userBid.productID, this.userBid.price, this.userBid.condition, this.pairPrice, this.pairSize)
        .then(response => {
          if (response) {
            this.addListed()
          } else {
            this.addError()
          }
        })
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

    this.bidService.checkUserBid(this.selectedPair.productID, this.selectedSize, this.user.uid, 'new').subscribe(response => {
      if (response.length > 0) {
        this.userBid = response[0]
      }
    })
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
