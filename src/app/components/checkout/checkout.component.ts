import { Component, OnInit, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { AuthService } from 'src/app/services/auth.service';
import { Title } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { MetaService } from 'src/app/services/meta.service';
import { SlackService } from 'src/app/services/slack.service';
import { Bid } from 'src/app/models/bid';
import { Ask } from 'src/app/models/ask';
import { Transaction } from 'src/app/models/transaction';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { AskService } from 'src/app/services/ask.service';
import { BidService } from 'src/app/services/bid.service';
import { NxtdropCC } from 'src/app/models/nxtdrop_cc';
import { NxtdropCcService } from 'src/app/services/nxtdrop-cc.service';
import { faCheckCircle, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { Globals } from 'src/app/globals';

declare const gtag: any;
declare const fbq: any;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  faCheckCircle = faCheckCircle
  faCircleNotch = faCircleNotch

  public payPalConfig?: IPayPalConfig;

  // cartItems = [];

  product: Ask | Bid | Transaction;
  shippingPrice = 15;
  subtotal = 0;
  total = 0;
  discount: NxtdropCC;

  connected = false;
  isSelling: any;

  user: User;

  // User Checking out item sold to them
  tID;

  // Promo variables
  promoError = false;
  promoApplied = false;
  promoLoading = false;
  freePair = false;
  discounted: boolean = false

  //Shipping Details Boolean
  showSellingShipping: boolean = false
  showBuyingShipping: boolean = false
  showNoneShipping: boolean = false

  //Checkout Btns Boolean
  showContinueShipping: boolean = false
  showPaypal: boolean = false
  showEditAsk: boolean = false
  showEditBid: boolean = false
  showConfirmSale: boolean = false
  showConfirmPurchase: boolean = false
  showLoginBtns: boolean = false

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private title: Title,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private _platformId: Object,
    private meta: MetaService,
    private slack: SlackService,
    private userService: UserService,
    private tranService: TransactionService,
    private askService: AskService,
    private bidService: BidService,
    private nxtdropCCService: NxtdropCcService,
    private globals: Globals
  ) { }

  ngOnInit() {
    this.tID = this.route.snapshot.queryParams.tID;
    this.title.setTitle(`Checkout | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Checkout');

    this.isSelling = this.route.snapshot.queryParams.sell;

    //Free Shipping between Sept. 29th 6PM & Oct. 7th 12AM
    const d = Date.now()
    if (d >= 1601416800000 && d < 1602129600000) {
      this.shippingPrice = 0
    }

    if (!(this.isSelling === undefined) && !(this.route.snapshot.queryParams.product === undefined)) {
      this.isUserConnected()
    } else {
      if (this.tID === undefined) {
        this.router.navigate([`..`]);
      } else {
        this.isUserConnected()
      }
    }
  }

  private initConfig() {
    this.payPalConfig = {
      currency: 'CAD',
      clientId: environment.payPal.apiKey,
      createOrderOnClient: (data) => <ICreateOrderRequest>{
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'CAD',
            value: (this.total).toString(),
            breakdown: {
              item_total: {
                currency_code: 'CAD',
                value: (this.total).toString()
              }
            }
          },
          items: [{
            name: `${this.product.model}, size ${this.product.size}`,
            quantity: '1',
            category: 'PHYSICAL_GOODS',
            unit_amount: {
              currency_code: 'CAD',
              value: (this.total).toString(),
            },
          }],
          shipping: {
            name: {
              full_name: `${this.user.shippingAddress.buying.firstName} ${this.user.shippingAddress.buying.lastName}`,
            },
            address: {
              address_line_1: this.user.shippingAddress.buying.street,
              address_line_2: this.user.shippingAddress.buying.line2,
              admin_area_1: this.user.shippingAddress.buying.province,
              admin_area_2: this.user.shippingAddress.buying.city,
              postal_code: this.user.shippingAddress.buying.postalCode,
              country_code: 'CA'
            }
          }
        }],
        payer: {
          email_address: this.user.email
        }
      },
      advanced: {
        commit: 'true'
      },
      style: {
        label: 'paypal',
        layout: 'vertical',
        shape: 'rect',
        tagline: false
      },
      onApprove: (data, actions) => {
        //console.log('onApprove - transaction was approved, but not authorized', data, actions);
        actions.order.get().then(details => {
          //console.log('onApprove - you can get full order details inside onApprove: ', details);

          this.user.shippingAddress.buying.street = details.purchase_units[0].shipping.address.address_line_1
          details.purchase_units[0].shipping.address.address_line_2 === undefined ? this.user.shippingAddress.buying.line2 = '' : this.user.shippingAddress.buying.line2 = details.purchase_units[0].shipping.address.address_line_2
          this.user.shippingAddress.buying.city = details.purchase_units[0].shipping.address.admin_area_2
          this.user.shippingAddress.buying.province = details.purchase_units[0].shipping.address.admin_area_1
          this.user.shippingAddress.buying.postalCode = details.purchase_units[0].shipping.address.postal_code
          this.user.shippingAddress.buying.country = details.purchase_units[0].shipping.address.country_code
          this.user.shippingAddress.buying.firstName = details.payer.name.given_name
          this.user.shippingAddress.buying.lastName = details.payer.name.surname

          this.userService.updateShippingInfo(this.user.uid, this.user.shippingAddress.buying.firstName, this.user.shippingAddress.buying.lastName, this.user.shippingAddress.buying.street, this.user.shippingAddress.buying.line2, this.user.shippingAddress.buying.city, this.user.shippingAddress.buying.province, this.user.shippingAddress.buying.postalCode, this.user.shippingAddress.buying.country, true)
        });
      },
      onClientAuthorization: (data) => {
        //console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
        let transaction;

        if (this.tID === undefined) {
          if (this.promoApplied) {
            transaction = this.tranService.transactionApproved(this.user.uid, this.product as Ask, this.user.shippingAddress.buying, data.id, this.shippingPrice, this.total, this.discount);
          } else {
            transaction = this.tranService.transactionApproved(this.user.uid, this.product as Ask, this.user.shippingAddress.buying, data.id, this.shippingPrice, this.total);
          }
        } else {
          if (this.promoApplied) {
            transaction = this.tranService.updateTransaction(this.user.uid, data.id, this.user.shippingAddress.buying, this.shippingPrice, this.tID, this.discount);
          } else {
            transaction = this.tranService.updateTransaction(this.user.uid, data.id, this.user.shippingAddress.buying, this.shippingPrice, this.tID);
          }
        }
        transaction.then(res => {
          if (isPlatformBrowser(this._platformId)) {
            gtag('event', 'item_bought', {
              'event_category': 'ecommerce',
              'event_label': this.product.model,
              'event_value': this.product.price
            });

            if (this.globals.exp003_version != undefined) {
              gtag('event', `${this.globals.exp003_version}_purchase`, {
                'event_category': `exp003`,
                'event_label': `${this.product.model}`,
                'event_value': `${this.product.price}`
              })
            }

            if (this.globals.exp001_version != undefined) {
              gtag('event', `${this.globals.exp001_version}_purchase`, {
                'event_category': 'exp001',
                'event_label': `${this.product.model}`,
                'event_value': `${this.product.price}`
              })
            }

            fbq('track', 'Purchase', {
              content_ids: [`${this.product.productID}`],
              content_name: this.product.model,
              content_type: 'sneaker',
              contents: [{ 'id': `${this.product.productID}`, 'quantity': '1' }],
              currency: 'CAD',
              num_items: 1,
              value: this.product.price + this.shippingPrice
            })
          }

          if (typeof res === 'boolean') {
            this.ngZone.run(() => {
              this.router.navigate(['transaction']);
            });
          } else {
            this.ngZone.run(() => {
              this.router.navigate(['transaction'], {
                queryParams: { transactionID: res, source: 'checkout' }
              });
            });
          }
        })
          .catch(err => {
            console.error(err);
            this.ngZone.run(() => {
              this.router.navigate(['transaction']);
            });
          });
      },
      onCancel: (data, actions) => {
        //console.log('OnCancel', data, actions);

        (document.getElementById('paypal-checkout') as HTMLInputElement).style.backgroundColor = "transparent"

      },
      onError: err => {
        //console.log('OnError', err);
        this.slack.sendAlert('bugreport', err)
      },
      onClick: (data, actions) => {
        //console.log('onClick', data, actions);

        (document.getElementById('paypal-checkout') as HTMLInputElement).style.backgroundColor = "white"

        console.log((this.total).toString())


        gtag('event', 'PP_click', {
          'event_category': 'ecommerce',
          'event_label': this.product.model
        });
      },
    };
  }

  applyPromo() {
    const now = Date.now();
    const code = (document.getElementById('promo-code') as HTMLInputElement).value

    if (code.length == 10) {
      this.promoLoading = true;
      this.nxtdropCCService.getPromoCode(code).subscribe(res => {
        //console.log(res.initiationDate)
        //console.log(this.user.creation_date)
        if (!(res === undefined) && res.amount > 0 && res.expirationDate > now && res.initiationDate > this.user.creation_date && !res.used_by.includes(this.user.uid)) {
          this.discount = res
          if (res.type === 'cash') {
            if (this.total <= res.amount) {
              this.total = 0;
              this.freePair = true;
            } else {
              this.total = this.total - res.amount;
            }
          } else {
            this.discount.amount = this.total * (this.discount.amount / 100)
            this.total = this.total - this.discount.amount
          }

          this.promoLoading = false;
          this.promoApplied = true;

          this.showCheckoutBtns()
        } else {
          this.promoLoading = false;
          this.promoError = true;

          setTimeout(() => {
            this.promoError = false;
          }, 2000);
        }
      })
    }
  }

  getListing(listingID: string, user?: firebase.User) {
    this.askService.getAsk(listingID).subscribe(res => {
      if (res === undefined) {
        this.router.navigate(['page-not-found']);
      } else {
        this.product = res;
        this.subtotal = this.product.price;
        this.total = this.subtotal + this.shippingPrice;

        if (isPlatformBrowser(this._platformId)) {
          gtag('event', 'begin_checkout', {
            'event_category': 'ecommerce',
            'event_label': this.product.model
          })

          if (!(user === undefined)) {
            this.updateLastCartItem(this.product.productID, this.product.size, user)

            if (user.phoneNumber === undefined && !(this.route.snapshot.queryParams.product === undefined) && this.isSelling) {
              this.router.navigate(['/phone-verification'], {
                queryParams: { redirectTo: `product/${this.product.model.replace(/\s/g, '-').replace(/["'()]/g, '').replace(/\//g, '-').toLowerCase()}` }
              });
            }
          }
        }

        if (user == undefined) {
          this.showShipping()
          this.showCheckoutBtns()
        } else {
          this.userService.getUserInfo(user.uid).subscribe(data => {
            this.user = data
            this.connected = true
            this.showShipping()
            this.showCheckoutBtns()

            if (res.sellerID != 'eOoTdK5Z8IYbbHq7uOc9y8gis5h1' && res.sellerID != 'zNSB9cdIPTZykSJv7xCoTeueFmk2' && Date.now() <= 1609477200000) {
              //console.log('work')
              this.discounted = true
              this.applyPromo()
            }
          })
        }

        fbq('track', 'InitiateCheckout', {
          content_category: 'sneaker',
          content_ids: [`${this.product.productID}`],
          contents: [{ 'id': `${this.product.productID}`, 'quantity': '1' }],
          currency: 'CAD',
          num_item: 1,
          value: this.product.price + this.shippingPrice
        })
      }
    })
  }

  getOffer(offerID: string, user?: firebase.User) {
    this.bidService.getBid(offerID).subscribe(res => {
      if (res === undefined) {
        this.router.navigate(['page-not-found']);
      } else {
        this.product = res;
        this.subtotal = this.product.price;
        this.total = this.subtotal + this.shippingPrice;
      }

      if (isPlatformBrowser(this._platformId)) {
        gtag('event', 'begin_checkout', {
          'event_category': 'ecommerce',
          'event_label': this.product.model
        });

        if (!(user === undefined) && user.phoneNumber === undefined && !(this.route.snapshot.queryParams.product === undefined) && this.isSelling) {
          this.router.navigate(['/phone-verification'], {
            queryParams: { redirectTo: `product/${this.product.model.replace(/\s/g, '-').replace(/["'()]/g, '').replace(/\//g, '-').toLowerCase()}` }
          });
        }
      }

      if (user === undefined) {
        this.showShipping()
        this.showCheckoutBtns()
      } else {
        this.userService.getUserInfo(user.uid).subscribe(data => {
          this.user = data
          this.connected = true
          this.showShipping()
          this.showCheckoutBtns()
        })
      }
    })
  }

  checkUserAndTransaction(transactionID: string, userID?: string) {
    this.tranService.checkTransaction(transactionID).subscribe(res => {
      if (!(res == undefined) && !res.status.cancelled && res.paymentID === '') {
        this.product = res
        this.subtotal = this.product.price
        this.total = this.subtotal + this.shippingPrice
        this.initConfig()

        if (!(userID === undefined)) {
          console.log('run if')
          this.userService.getUserInfo(userID).subscribe(data => {
            this.user = data
            this.connected = true

            if (!(data.uid == undefined)) {
              this.showShipping()
              this.showCheckoutBtns()
            }
          })
        } else {
          console.log('run else')
          this.showShipping()
          this.showCheckoutBtns()
        }
      } else {
        this.router.navigate(['page-not-found']);
      }
    })
  }

  sellNow() {
    this.tranService.sellTransactionApproved(this.user.uid, this.product as Bid).then(res => {
      if (isPlatformBrowser(this._platformId)) {
        gtag('event', 'item_sold', {
          'event_category': 'ecommerce',
          'event_label': this.product.model,
          'event_value': this.product.price
        });

        if (this.globals.exp001_version != undefined) {
          if (this.globals.exp001_version == 'exp001a') {
            gtag('event', 'exp001a_bid_accepted', {
              'event_category': 'exp001',
              'event_label': `${this.product.model}`,
              'event_value': `${this.product.price}`
            })
          } else if (this.globals.exp001_version == 'exp001b') {
            gtag('event', 'exp001b_bid_accepted', {
              'event_category': 'exp001',
              'event_label': `${this.product.model}`,
              'event_value': `${this.product.price}`
            })
          } else if (this.globals.exp001_version == 'exp001c') {
            gtag('event', 'exp001c_bid_accepted', {
              'event_category': 'exp001',
              'event_label': `${this.product.model}`,
              'event_value': `${this.product.price}`
            })
          } else if (this.globals.exp001_version == 'exp001d') {
            gtag('event', 'exp001d_bid_accepted', {
              'event_category': 'exp001',
              'event_label': `${this.product.model}`,
              'event_value': `${this.product.price}`
            })
          }
        }
      }

      if (typeof res === 'boolean') {
        this.router.navigate(['sold']);
      } else {
        this.router.navigate(['sold'], {
          queryParams: { transactionID: res }
        });
      }
    })
      .catch(err => {
        console.error(err);
        this.router.navigate(['sold']);
      });
  }

  buyNow() {
    this.tranService.transactionApproved(this.user.uid, this.product as Ask, this.user.shippingAddress.buying, this.discount.cardID, this.shippingPrice, this.total, this.discount)
      .then(res => {
        if (isPlatformBrowser(this._platformId)) {
          gtag('event', 'purchase', {
            'event_category': 'ecommerce',
            'event_label': this.product.model,
            'event_value': this.product.price
          });
        }

        if (typeof res === 'undefined') {
          this.ngZone.run(() => {
            this.router.navigate(['transaction']);
          });
        } else {
          this.ngZone.run(() => {
            this.router.navigate(['transaction'], {
              queryParams: { transactionID: res }
            });
          });
        }
      }).catch(err => {
        console.error(err);
        this.ngZone.run(() => {
          this.router.navigate(['transaction']);
        });
      });
  }

  fee() {
    let subtotal = this.subtotal;

    return subtotal * 0.085;
  }

  processing() {
    let subtotal = this.subtotal;

    return subtotal * 0.03;
  }

  goBack() {
    const id = this.product.productID;

    if (this.route.snapshot.queryParams.redirectTo === undefined) {
      this.router.navigate([`product/${id}`]);
    } else {
      this.router.navigateByUrl(this.route.snapshot.queryParams.redirectTo)
    }
  }

  connect(mode) {
    if (mode === 'login') {
      this.router.navigate(['login'], {
        queryParams: { redirectTo: this.router.url }
      });
    } else if (mode === 'signup') {
      this.router.navigate(['signup'], {
        queryParams: { redirectTo: this.router.url }
      });
    }
  }

  updateLastCartItem(product_id: string, size: string, user: firebase.User) {
    this.userService.updateLastCartItem(user.uid, product_id, size);
  }

  private isUserConnected() {
    this.auth.isConnected().then(res => {
      if (!(res === undefined)) {
        if (!(this.tID === undefined)) {
          this.checkUserAndTransaction(this.tID, res.uid);
        } else {
          if (this.isSelling != 'true') {
            this.isSelling = false;
            this.getListing(this.route.snapshot.queryParams.product, res);
            this.initConfig();
          } else {
            this.isSelling = true;
            this.getOffer(this.route.snapshot.queryParams.product, res);
          }
        }
      } else {
        if (!(this.tID === undefined)) {
          this.checkUserAndTransaction(this.tID);
        } else {
          if (this.isSelling != 'true') {
            this.getListing(this.route.snapshot.queryParams.product);
            this.isSelling = false;
          } else {
            this.isSelling = true;
            this.getOffer(this.route.snapshot.queryParams.product);
          }
        }
      }
    });
  }

  editShipping() {
    if (this.isSelling) {
      this.router.navigate(['../settings/shipping/selling'], {
        queryParams: { redirectURI: this.router.url }
      });
    } else {
      this.router.navigate(['../settings/shipping/buying'], {
        queryParams: { redirectURI: this.router.url }
      });
    }
  }

  showShipping() {
    if (this.connected) {
      if (this.isSelling === undefined) {
        this.showBuyingShipping = true
      } else if (!this.isSelling) {
        if (this.user.shippingAddress === undefined) {
          this.showBuyingShipping = false
        } else if (!(this.user.shippingAddress.buying === undefined)) {
          this.showBuyingShipping = true
        }
      } else if (this.isSelling) {
        if (this.user.shippingAddress === undefined) {
          this.showSellingShipping = false
        } else if (!(this.user.shippingAddress.selling === undefined)) {
          this.showSellingShipping = true
        }
      }

      this.showBuyingShipping || this.showSellingShipping ? this.showNoneShipping = false : this.showNoneShipping = true
    }
  }

  showCheckoutBtns() {
    this.showContinueShipping = this.showPaypal = this.showEditAsk = this.showEditBid = this.showConfirmSale = this.showConfirmPurchase = this.showLoginBtns = false

    if (!this.connected) {
      this.showLoginBtns = true
    } else {
      if (!(this.tID === undefined)) {
        const t = this.product as Transaction
        if (t.buyerID === this.user.uid && this.user.shippingAddress === undefined || this.user.shippingAddress.buying === undefined) this.showContinueShipping = true
        else this.showPaypal = true
      } else if (this.isSelling) {
        const t = this.product as Bid
        if (t.buyerID === this.user.uid) this.showEditBid = true
        else if (this.user.shippingAddress === undefined || this.user.shippingAddress.selling === undefined) this.showContinueShipping = true
        else this.showConfirmSale = true
      } else if (!this.isSelling) {
        const t = this.product as Ask
        if (t.sellerID === this.user.uid) this.showEditAsk = true
        else if (this.user.shippingAddress === undefined || this.user.shippingAddress.buying === undefined) this.showContinueShipping = true
        else if (this.total === 0) this.showConfirmPurchase = true
        else this.showPaypal = true
      }
    }
  }
}
