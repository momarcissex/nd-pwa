import { Component, OnInit, NgZone, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'
import { ProductService } from 'src/app/services/product.service';
import { AuthService } from 'src/app/services/auth.service';
import { Title } from '@angular/platform-browser';
import { Product } from 'src/app/models/product';
import { MetaService } from 'src/app/services/meta.service';
import { isPlatformBrowser } from '@angular/common';
import { AskService } from 'src/app/services/ask.service';
import { BidService } from 'src/app/services/bid.service';
import { faFacebookF, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faLink } from '@fortawesome/free-solid-svg-icons';

declare const gtag: any;
declare const fbq: any;

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit {

  faFacebookF = faFacebookF
  faTwitter = faTwitter
  faEnvelope = faEnvelope
  faLink = faLink

  productID: string

  default_sizes: { [key: string]: string[] } = {
    'M': ['US3', 'US3.5', 'US4', 'US4.5', 'US5', 'US5.5', 'US6', 'US6.5', 'US7', 'US7.5', 'US8', 'US8.5', 'US9', 'US9.5', 'US10', 'US10.5', 'US11', 'US11.5', 'US12', 'US12.5', 'US13', 'US13.5', 'US14', 'US14.5', 'US15', 'US15.5', 'US16', 'US16.5', 'US17', 'US18'],
    'Y': ['US3Y', 'US3.5Y', 'US4Y', 'US4.5Y', 'US5Y', 'US5.5Y', 'US6Y', 'US6.5Y', 'US7Y'],
    'W': ['US4W', 'US4.5', 'US5W', 'US5.5W', 'US6W', 'US6.5W', 'US7W', 'US7.5W', 'US8W', 'US8.5W', 'US9W', 'US9.5W', 'US10W', 'US10.5W', 'US11W', 'US11.5W', 'US12W', 'US12.5W', 'US13W', 'US13.5W', 'US14W', 'US14.5W', 'US15W', 'US15.5W', 'US16W', 'US16.5W']
  } //default sizes
  sizeSuffix: string = ''

  productInfo: Product = {
    assetURL: '',
    model: '',
    line: '',
    brand: '',
    yearMade: '',
    product_type: '',
    productID: '',
    colorway: '',
    sizes: [],
    size_category: ''
  }

  offers = []
  currentOffer = {
    LowestAsk: '',
    HighestBid: ''
  }
  sizeSelected: string = ''
  lowestAsk: any
  highestBid: any

  modalTimeout

  UID: string

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private auth: AuthService,
    private router: Router,
    private title: Title,
    private seo: MetaService,
    private ngZone: NgZone,
    private askService: AskService,
    private bidService: BidService,
    @Inject(PLATFORM_ID) private platform_id: Object
  ) { }

  async ngOnInit() {
    //console.log('oninit start')
    this.productID = this.route.snapshot.params.id;

    this.auth.isConnected().then((res) => {
      //console.log('isConnected start')
      if (!(res === undefined)) {
        this.UID = res.uid;
      }
      //console.log('isConnected end')
    });

    await this.getItemInformation()

    this.getSizeSuffix();
    //console.log('oninit end')
  }

  /*addToCart(listing) {
    this.productService.addToCart(listing).then(res => {
      if (res) {
        // console.log('Added to cart');
      } else {
        // console.log('Cannot add to cart');
      }
    });
  }*/

  async getItemInformation() {
    //console.log('getItemInformation start')
    this.productService.getProductInfo(this.productID).subscribe(data => {
      console.log('getProductInfo start')
      console.log(data)
      if (data === undefined) {
        this.router.navigate([`page-not-found`]);
      } else {
        if (this.productInfo.assetURL === '') {
          console.log('seo etc')
          this.title.setTitle(`${data.model} - ${data.brand} | NXTDROP`);
          this.seo.addTags('Product', data);

          fbq('track', 'ViewContent', {
            content_ids: [`${this.productID}`],
            content_category: '187',
            content_name: `${data.model}`,
            content_type: 'product',
            contents: [{ 'id': `${this.productID}`, 'quantity': '1' }],
          })
        }

        this.productInfo = data;
      }

      if (this.offers.length === 0) {
        this.getOffers();
      }
      //console.log('getProductInfo end')
    });
  }

  getSizeSuffix() {
    const patternW = new RegExp(/.+\-W$/);
    const patternGS = new RegExp(/.+\-GS$/);

    if (patternW.test(this.productID.toUpperCase())) {
      //console.log('Woman Size');
      this.sizeSuffix = 'W';
    } else if (patternGS.test(this.productID.toUpperCase())) {
      //console.log(`GS size`);
      this.sizeSuffix = 'Y';
    }
  }

  async countView() {
    //console.log('countView start')
    if (!(this.UID == null || this.UID == undefined)) {
      this.productService.countView(this.productID).then(() => {
        //console.log('view count updated')
      }).catch(err => {
        console.error(err);
      })
    }

    //console.log('countView end')
  }

  buyNow(listing) {
    const data = JSON.stringify(listing);
    clearTimeout(this.modalTimeout);
    this.ngZone.run(() => {
      this.router.navigate([`../../checkout`], {
        queryParams: { product: data, sell: false }
      });
    });
  }

  sell(offer) {
    const data = JSON.stringify(offer);
    this.ngZone.run(() => {
      this.router.navigate([`../../checkout`], {
        queryParams: { product: data, sell: true }
      });
    });
  }

  share(social: string) {
    if (isPlatformBrowser(this.platform_id)) {

      this.productService.shareCount(this.productInfo.productID).then(() => {
        //console.log('trending score update')
      })
        .catch(err => {
          console.error(err)
        })

      if (social === 'fb') {
        window.open(`https://www.facebook.com/sharer/sharer.php?app_id=316718239101883&u=https://nxtdrop.com/product/${this.productID}&display=popup&ref=plugin`, 'popup', 'width=600,height=600,scrollbars=no,resizable=no');
        gtag('event', 'share_product_fb', {
          'event_category': 'engagement',
          'event_label': this.productInfo.model
        });
        return false;
      } else if (social === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=Check out the ${this.productInfo.model} available on @nxtdrop https://nxtdrop.com/product/${this.productID}`, 'popup', 'width=600,height=600,scrollbars=no,resizable=no');
        gtag('event', 'share_product_twitter', {
          'event_category': 'engagement',
          'event_label': this.productInfo.model
        });
        return false;
      } else if (social === 'mail') {
        window.location.href = `mailto:?subject=Check out the ${this.productInfo.model} available on NXTDROP&body=Hey, I just came across the ${this.productInfo.model} and thought you'd be interested. Check it out here https://nxtdrop.com/product/${this.productID}`;
        gtag('event', 'share_product_mail', {
          'event_category': 'engagement',
          'event_label': this.productInfo.model
        });
        return false;
      } else if (social === 'copy_link') {
        this.copyStringToClipboard(`https://nxtdrop.com/product/${this.productID}`);
        gtag('event', 'share_news_link', {
          'event_category': 'engagement',
          'event_label': this.productInfo.model
        });
      } else {
        return false;
      }
    }
  }

  copyStringToClipboard(str: string) {
    if (isPlatformBrowser(this.platform_id)) {
      const el = document.createElement('textarea');
      el.value = str;
      el.style.visibility = 'none';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);

      document.getElementById('tooltiptext').style.visibility = 'visible';
      document.getElementById('tooltiptext').style.opacity = '1';

      setTimeout(() => {
        document.getElementById('tooltiptext').style.visibility = 'none';
        document.getElementById('tooltiptext').style.opacity = '0';
      }, 3000);
    }
  }

  getOffers() {
    //console.log('getOffers start')
    let suffix: string;
    let shoeSizes: Array<string> | Array<number>;
    this.offers.length = 0

    if (this.productInfo.size_category === undefined) {
      if (this.sizeSuffix === 'W') {
        suffix = this.sizeSuffix;
      } else if (this.sizeSuffix === 'Y') {
        suffix = this.sizeSuffix;
      } else {
        suffix = 'M';
      }
    } else {
      suffix = this.productInfo.size_category

      if (this.productInfo.size_category === 'GS') {
        this.sizeSuffix = 'Y'
      } else if (this.productInfo.size_category === 'W') {
        this.sizeSuffix = 'W'
      }
    }

    //console.log(this.sizes[suffix]);
    //console.log(this.productInfo.sizes)
    if (!(this.productInfo.sizes === undefined)) {
      shoeSizes = this.productInfo.sizes
    } else {
      shoeSizes = this.default_sizes[suffix]
    }

    shoeSizes.forEach(ele => {
      let ask: any;
      let bid: any;
      let size;

      if (typeof ele === 'number') {
        size = `US${ele}${this.sizeSuffix}`;
      } else {
        size = ele
      }

      this.bidService.getHighestBid(`${this.productID}`, 'new', size).then(bidData => {
        bidData.empty ? bid = undefined : bid = bidData.docs[0].data()

        this.askService.getLowestAsk(`${this.productID}`, 'new', size).then(askData => {
          askData.empty ? ask = undefined : ask = askData.docs[0].data()

          const data = {
            LowestAsk: ask,
            HighestBid: bid,
            size: size
          }

          this.offers.push(data);

          if (!(data.LowestAsk === undefined)) {
            if (this.lowestAsk === undefined) {
              this.lowestAsk = data.LowestAsk;
            } else if (this.lowestAsk.price > data.LowestAsk.price) {
              this.lowestAsk = data.LowestAsk;
            }
          }

          if (!(data.HighestBid === undefined)) {
            if (this.highestBid === undefined) {
              this.highestBid = data.HighestBid;
            } else if (this.highestBid.price < data.HighestBid.price) {
              this.highestBid = data.HighestBid;
            }
          }

          if (shoeSizes.length === this.offers.length) {
            this.currentOffer.LowestAsk = this.lowestAsk;
            this.currentOffer.HighestBid = this.highestBid;
            this.countView()
          }
        });
      });
    });
    //console.log('getOffers end')
  }

  selectSize(selected: any) {
    const result = this.offers.find(({ size }) => size === selected);

    if (selected === this.sizeSelected) {
      this.sizeSelected = '';
      this.currentOffer.LowestAsk = this.lowestAsk;
      this.currentOffer.HighestBid = this.highestBid;
      (document.getElementById(`${selected}`) as HTMLInputElement).classList.remove('selected');
    } else {
      if (this.sizeSelected != '') {
        (document.getElementById(`${this.sizeSelected}`) as HTMLInputElement).classList.remove('selected');
      }

      this.currentOffer = Object.assign({}, result);
      this.sizeSelected = selected;
      (document.getElementById(`${selected}`) as HTMLInputElement).classList.add('selected');
      document.body.scrollTop = 0; //For Safari
      window.scrollTo({ top: 0, behavior: 'smooth' }); //For Chrome, Firefox, Opera and IE
    }
  }

  sizeAlert() {
    const w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth

    if (w >= 800) {
      alert('Please select a size')
    } else {
      alert('Please select a size below')
    }
  }

}
