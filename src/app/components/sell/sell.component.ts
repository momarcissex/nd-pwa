import { Component, OnInit, NgZone, PLATFORM_ID, Inject } from '@angular/core';
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
import { AskService } from 'src/app/services/ask.service';
import { BidService } from 'src/app/services/bid.service';
import { User } from 'firebase';
import { faBox, faCircleNotch, faMoneyBillWave, faTag } from '@fortawesome/free-solid-svg-icons';

declare const gtag: any;

@Component({
  selector: 'app-sell',
  templateUrl: './sell.component.html',
  styleUrls: ['./sell.component.scss']
})
export class SellComponent implements OnInit {

  faTag = faTag
  faBox = faBox
  faMoneyBillWave = faMoneyBillWave
  faCircleNotch = faCircleNotch

  // Algolia Set up
  algoliaClient = algoliasearch(environment.algolia.appId, environment.algolia.apiKey)
  index
  results

  showResults = false

  showHowItWorks: boolean = true
  showSearch: boolean = false
  showItem: boolean = false

  default_sizes: { [key: string]: string[] } = {
    'M': ['US3', 'US3.5', 'US4', 'US4.5', 'US5', 'US5.5', 'US6', 'US6.5', 'US7', 'US7.5', 'US8', 'US8.5', 'US9', 'US9.5', 'US10', 'US10.5', 'US11', 'US11.5', 'US12', 'US12.5', 'US13', 'US13.5', 'US14', 'US14.5', 'US15', 'US15.5', 'US16', 'US16.5', 'US17', 'US18'],
    'Y': ['US3Y', 'US3.5Y', 'US4Y', 'US4.5Y', 'US5Y', 'US5.5Y', 'US6Y', 'US6.5Y', 'US7Y'],
    'W': ['US4W', 'US4.5', 'US5W', 'US5.5W', 'US6W', 'US6.5W', 'US7W', 'US7.5W', 'US8W', 'US8.5W', 'US9W', 'US9.5W', 'US10W', 'US10.5W', 'US11W', 'US11.5W', 'US12W', 'US12.5W', 'US13W', 'US13.5W', 'US14W', 'US14.5W', 'US15W', 'US15.5W', 'US16W', 'US16.5W']
  } //default sizes
  sizeType: string = 'M' //M, W or Y
  sizeSuffix: string = '' //size suffix (M, W or Y)

  offers = [] //list of bids

  inputLength = 0 // Length of search box input

  selectedPair: Product // Listing Product object
  selectedSize: string = '' //size selected to place an ask on

  HighestBid: any = NaN
  LowestAsk: any = NaN
  currentBid: any = NaN
  currentAsk: any = NaN

  // Listing Information
  pairCondition: string
  pairPrice: number
  pairSize: string

  priceAdded = false

  // Page 4 boolean
  loading = false
  listed = false
  error = false

  user: User;

  // seller fees and payout
  consignmentFee = 0
  paymentProcessingFee = 0
  payout = 0

  // boolean seller agreement
  isDeadstock = false
  willShip = false

  expiration_date: number = Date.now() + (86400000 * 30) //ask's expiration date

  constructor(
    private askService: AskService,
    private bidService: BidService,
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
        if (isNullOrUndefined(res.phoneNumber) && res.email != "momarcisse0@gmail.com") {
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

    if (isNaN(this.pairPrice) || !this.isDeadstock || !this.willShip) {
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

    this.askService.submitAsk(this.selectedPair, 'new', this.pairPrice, this.pairSize, this.expiration_date)
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
    this.consignmentFee = this.pairPrice * 0.085;
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
    let shoeSizes: Array<string>;
    //console.log(this.selectedPair.sizes)

    if (!isNullOrUndefined(this.selectedPair.sizes)) {
      shoeSizes = this.selectedPair.sizes
    } else {
      shoeSizes = this.default_sizes[this.sizeType]
    }

    shoeSizes.forEach(ele => {
      let bid: any;
      const size = ele

      this.bidService.getHighestBid(this.selectedPair.productID, 'new', size).then(bidData => {
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
    this.askService.getLowestAsk(this.selectedPair.productID, 'new').then(response => {
      response.empty ? this.LowestAsk = undefined : this.LowestAsk = response.docs[0].data() as Ask

      this.bidService.getHighestBid(this.selectedPair.productID, 'new').then(res => {
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

  sellNow() {
    this.ngZone.run(() => {
      this.router.navigate([`../../checkout`], {
        queryParams: { product: this.currentBid.offerID, sell: true }
      });
    });
  }

  selectSize(size: string) {
    this.selectedSize = size;

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

  agreementsCheckbox(mode: string) {
    if (mode === 'deadstock') {
      this.isDeadstock = !this.isDeadstock
    } else if (mode === 'ship') {
      this.willShip = !this.willShip
    }
  }

  finish() {
    return this.ngZone.run(() => {
      return this.router.navigate([`/product/${this.selectedPair.productID}`]);
    });
  }

}
