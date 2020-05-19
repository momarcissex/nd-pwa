import { Component, OnInit, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { SellService } from 'src/app/services/sell.service';
import { Product } from 'src/app/models/product';
import { Router, ActivatedRoute } from '@angular/router';
import { isUndefined, isNullOrUndefined, isNull } from 'util';
import { AuthService } from 'src/app/services/auth.service';
import { Title } from '@angular/platform-browser';
import { SlackService } from 'src/app/services/slack.service';
import * as algoliasearch from 'algoliasearch';
import { environment } from 'src/environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { MetaService } from 'src/app/services/meta.service';
import { Bid } from 'src/app/models/bid';
import { Ask } from 'src/app/models/ask';

declare const gtag: any;

@Component({
  selector: 'app-sell',
  templateUrl: './sell.component.html',
  styleUrls: ['./sell.component.scss']
})
export class SellComponent implements OnInit {

  // Algolia Set up
  algoliaClient = algoliasearch(environment.algolia.appId, environment.algolia.apiKey);
  index;
  results;

  showResults = false;

  showHowItWorks: boolean = true;
  showSearch: boolean = false;
  showItem: boolean = false;

  default_sizes: { [keys: string]: number[] } = {
    "M": [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 18],
    "W": [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5],
    "GS": [3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7]
  };
  sizeType: string = 'M';
  sizeSuffix: string = '';

  offers = [];

  inputLength = 0; // Length of search box input

  selectedPair: Product; // Listing Product object
  selectedSize: string = '';

  HighestBid: any = NaN;
  LowestAsk: any = NaN;
  currentBid: any = NaN;
  currentAsk: any = NaN;

  // Listing Information
  pairCondition: string;
  pairPrice: number;
  pairSize: string;

  priceAdded = false;

  // Page 4 boolean
  loading = false;
  listed = false;
  error = false;

  user: any;

  consignmentFee = 0;
  paymentProcessingFee = 0;
  payout = 0;

  constructor(
    private sellService: SellService,
    private ngZone: NgZone,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private auth: AuthService,
    private title: Title,
    private slack: SlackService,
    @Inject(PLATFORM_ID) private _platformId: Object,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Sell | NXTDROP: Sell and Buy Sneakers in Canada`); // Change the page title
    this.meta.addTags('Sell');

    this.index = this.algoliaClient.initIndex(environment.algolia.index);

    // Skip the first page and serves the third page
    this.activatedRoute.queryParams.subscribe(params => {
      if (!isUndefined(params.sneaker)) {
        this.selectPair(JSON.parse(params.sneaker), false);

        if (!isNullOrUndefined(params.size)) {
          this.selectSize(params.size);
        }
      }
    });

    // check if the user is connected and redirect if not
    this.auth.isConnected().then(res => {
      if (!isNull(res)) {
        this.user = res;

        // redirect is phone number verification not verified
        if (isNullOrUndefined(res.phoneNumber) && res.email != "momarcisse0@gmail.com" && res.email != "blvckpvblo@gmail.com" && res.email != "momar@nxtdrop.com") {
          if (this.activatedRoute.snapshot.queryParams.sneaker) {
            this.router.navigate(['../phone-verification'], {
              queryParams: { redirectTo: `product/${this.selectedPair.productID}` }
            });
          } else {
            this.router.navigate(['../phone-verification'], {
              queryParams: { redirectTo: `sell` }
            });
          }
        }
      }
    });
  }

  submitListing() {
    this.pairPrice = this.getPrice();
    this.pairSize = this.selectedSize;
    this.loading = true;

    if (isNaN(this.pairPrice)) {
      this.addError();
      return;
    }

    this.sellService.addListing(this.selectedPair, 'new', this.pairPrice, this.pairSize, this.currentAsk.price)
      .then((res) => {
        if (isPlatformBrowser(this._platformId)) {
          gtag('event', 'ask', {
            'event_category': 'engagement',
            'event_label': this.selectedPair.model,
            'event_value': this.pairPrice
          });
        }

        if (res) {
          const msg = `${this.user.uid} listed ${this.selectedPair.model}, size ${this.pairSize} at ${this.pairPrice}`;
          this.slack.sendAlert('listings', msg);

          this.addListed();
        } else {
          this.addError();
        }
      });
  }

  priceChanges($event) {
    if ($event.target.value != `` && +$event.target.value >= 40) {
      this.priceAdded = true;
      this.pairPrice = +$event.target.value;
      this.calculateSellerFees();
    } else {
      this.priceAdded = false;
      this.pairPrice = 0;
      this.consignmentFee = 0;
      this.payout = 0;
      this.paymentProcessingFee = 0;
    }
  }

  private calculateSellerFees() {
    this.consignmentFee = this.pairPrice * 0.095;
    this.paymentProcessingFee = this.pairPrice * 0.03;
    this.payout = this.pairPrice - this.consignmentFee - this.paymentProcessingFee;
  }

  private getPrice() {
    const price = (document.getElementById('input') as HTMLInputElement).value;
    return +price;
  }

  selectPair(pair: Product, updateURL: boolean) {
    this.selectedPair = pair

    const patternW = new RegExp(/.\(W\)/);
    const patternGS = new RegExp(/.\(GS\)/);

    console.log(pair.model.toUpperCase());
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

  getOffers() {
    let shoeSizes: Array<number>;
    //console.log(this.selectedPair.sizes)

    if (!isNullOrUndefined(this.selectedPair.sizes)) {
      shoeSizes = this.selectedPair.sizes
    } else {
      shoeSizes = this.default_sizes[this.sizeType]
    }

    shoeSizes.forEach(ele => {
      let bid: any;
      const size = `US${ele}${this.sizeSuffix}`;

      this.sellService.getHighestOffer(this.selectedPair.productID, 'new', size).then(bidData => {
        bidData.empty ? bid = undefined : bid = bidData.docs[0].data() as Bid

        const data = {
          HighestBid: bid,
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
    this.sellService.getLowestListing(this.selectedPair.productID, 'new').then(response => {
      response.empty ? this.LowestAsk = undefined : this.LowestAsk = response.docs[0].data() as Ask

      this.sellService.getHighestOffer(this.selectedPair.productID, 'new').then(res => {
        res.empty ? this.HighestBid = undefined : this.HighestBid = res.docs[0].data() as Bid

        if (!this.selectedSize) {
          this.currentAsk = this.LowestAsk;
          this.currentBid = this.HighestBid;
        }
      });
    });
  }

  searchChanged(event) {
    this.inputLength = event.target.value.length;

    if (this.inputLength) {
      this.showResults = true;

      console.log(event.target.value);

      this.index.search({
        query: event.target.value
      }, (err, hits: any = {}) => {
        if (err) throw err;

        this.results = hits.hits;
        console.log(hits);
      });
    } else {
      this.showResults = false;
    }
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

    setTimeout(() => {
      return this.ngZone.run(() => {
        return this.router.navigate([`/product/${this.selectedPair.productID}`]);
      });
    }, 2500);
  }

  sellNow() {
    this.ngZone.run(() => {
      this.router.navigate([`../../checkout`], {
        queryParams: { product: this.currentBid.offerID, sell: true }
      });
    });
  }

  selectSize(size: string) {
    this.selectedSize = size;

    this.sellService.getHighestOffer(this.selectedPair.productID, 'new', this.selectedSize).then(res => {
      if (res.empty) {
        this.currentBid = NaN;
      } else {
        this.currentBid = res.docs[0].data() as Bid
      }
    });

    this.sellService.getLowestListing(this.selectedPair.productID, 'new', this.selectedSize).then(res => {
      if (res.empty) {
        this.currentAsk = NaN;
      } else {
        this.currentAsk = res.docs[0].data() as Ask
      }
    });
  }

  changeSize() {
    this.selectedSize = '';
    this.currentBid = this.HighestBid;
    this.currentAsk = this.LowestAsk;
    this.priceAdded = false;
    this.pairPrice = NaN;
    this.consignmentFee = 0;
    this.payout = 0;
    this.paymentProcessingFee = 0;
  }

}
