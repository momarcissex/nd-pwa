import { Component, OnInit, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { CheckoutService } from 'src/app/services/checkout.service';
import { Router, ActivatedRoute } from '@angular/router';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { AuthService } from 'src/app/services/auth.service';
import { isNullOrUndefined, isBoolean, isUndefined, isNull } from 'util';
import { Title } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { MetaService } from 'src/app/services/meta.service';
import { SlackService } from 'src/app/services/slack.service';
import { Bid } from 'src/app/models/bid';
import { Ask } from 'src/app/models/ask';
import { Transaction } from 'src/app/models/transaction';

declare const gtag: any;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  public payPalConfig?: IPayPalConfig;

  /*shippingInfo = {
    street: '',
    line: '',
    city: '',
    postalCode: '',
    province: '',
    country: '',
    firstName: '',
    lastName: ''
  };*/

  // cartItems = [];

  product: Ask | Bid | Transaction;
  shippingPrice = 15;
  subtotal = 0;
  total = 0;
  discount = 0;
  discountCardID: string;

  connected = false;
  isSelling: any;

  userID: string;

  // User Checking out item sold to them
  tID;

  // Promo variables
  promoError = false;
  promoApplied = false;
  promoLoading = false;
  freePair = false;

  constructor(
    private checkoutService: CheckoutService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private title: Title,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private _platformId: Object,
    private meta: MetaService,
    private slack: SlackService
  ) { }

  ngOnInit() {
    this.tID = this.route.snapshot.queryParams.tID;
    this.title.setTitle(`Checkout | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Checkout');

    this.isSelling = this.route.snapshot.queryParams.sell;

    if (!isUndefined(this.isSelling) && !isUndefined(this.route.snapshot.queryParams.product)) {
      if (this.isSelling != 'true') {
        this.getListing(this.route.snapshot.queryParams.product);
        this.isSelling = false;
        this.initConfig();
      } else {
        this.isSelling = true;
        this.getOffer(this.route.snapshot.queryParams.product);
      }
    } else {
      if (isUndefined(this.tID)) {
        this.router.navigate([`..`]);
      } else {
        this.isUserConnected()
      }
    }

    // console.log(this.product);

    /*this.checkoutService.getCartItems().then(res => {
      res.subscribe(data => {
        this.cartItems = data;
      });
    });

    this.checkoutService.getShippingInfo().then(data => {
      this.shippingInfo = data;
    })*/
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
          }]
        }]
      },
      advanced: {
        commit: 'true'
      },
      style: {
        label: 'paypal',
        layout: 'vertical',
        color: 'silver',
        shape: 'rect',
        tagline: false
      },
      onApprove: (data, actions) => {
        //console.log('onApprove - transaction was approved, but not authorized', data, actions);
        actions.order.get().then(details => {
          //console.log('onApprove - you can get full order details inside onApprove: ', details);
        });
      },
      onClientAuthorization: (data) => {
        //console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
        let transaction;

        if (isUndefined(this.tID)) {
          if (this.promoApplied) {
            transaction = this.checkoutService.transactionApproved(this.product, data.id, this.shippingPrice, this.total, this.discount, this.discountCardID);
          } else {
            transaction = this.checkoutService.transactionApproved(this.product, data.id, this.shippingPrice, this.total);
          }
        } else {
          if (this.promoApplied) {
            transaction = this.checkoutService.addTransaction(this.product, data.id, this.shippingPrice, this.tID, this.discount, this.discountCardID);
          } else {
            transaction = this.checkoutService.addTransaction(this.product, data.id, this.shippingPrice, this.tID);
          }
        }
        transaction.then(res => {
          if (isPlatformBrowser(this._platformId)) {
            gtag('event', 'item_bought', {
              'event_category': 'ecommerce',
              'event_label': this.product.model,
              'event_value': this.product.price
            });
          }

          if (isBoolean(res)) {
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

      },
      onError: err => {
        //console.log('OnError', err);
        this.slack.sendAlert('bugreport', err)
      },
      onClick: (data, actions) => {
        //console.log('onClick', data, actions);
        gtag('event', 'PP_click', {
          'event_category': 'ecommerce',
          'event_label': this.product.model
        });
      },
    };
  }

  applyPromo() {
    const code = (document.getElementById('promo-code') as HTMLInputElement).value;
    const now = Date.now();

    if (code.length == 10) {
      this.promoLoading = true;
      this.checkoutService.getPromoCode(code).then(res => {
        if (res.exists && res.data().amount != 0 && res.data().expirationDate > now) {
          if (this.total <= res.data().amount) {
            this.discount = this.total;
            this.total = 0;
            this.freePair = true;
          } else {
            this.total = this.total - res.data().amount;
            this.discount = res.data().amount;
          }

          this.promoLoading = false;
          this.promoApplied = true;
          this.discountCardID = code;
        } else {
          this.promoLoading = false;
          this.promoError = true;

          setTimeout(() => {
            this.promoError = false;
          }, 2000);
        }
      }).catch(err => {
        console.error(err);
        this.promoLoading = false;
        this.promoError = true;

        setTimeout(() => {
          this.promoError = false;
        }, 2000);
      })
    }
  }

  /*private checkFreeShipping() {
    if (this.connected) {
      this.checkoutService.getFreeShipping().then(res => {
        res.subscribe(response => {
          //console.log(response);
          if (!isUndefined(response.data().freeShipping) || response.data().ordered === 0) {
            this.shippingPrice = 0;
          } else {
            this.shippingPrice = 18;
          }

          this.total = this.subtotal + this.shippingPrice;
        })
      });
    } else {
      this.total = this.subtotal + this.shippingPrice;
    }
  }*/

  getListing(listingID: string) {
    this.isUserConnected()

    this.checkoutService.getListing(listingID).then(res => {
      if (isNullOrUndefined(res.data())) {
        this.router.navigate(['page-not-found']);
      } else {
        this.product = res.data() as Ask;
        this.subtotal = this.product.price;
        this.total = this.subtotal + this.shippingPrice;

        if (isPlatformBrowser(this._platformId)) {
          gtag('event', 'begin_checkout', {
            'event_category': 'ecommerce',
            'event_label': this.product.model
          });

          if (!isNullOrUndefined(this.userID)) {
            this.updateLastCartItem(this.product.productID, this.product.size)
          }
        }
      }
    });
  }

  getOffer(offerID: string) {
    this.isUserConnected()

    this.checkoutService.getOffer(offerID).then(res => {
      if (isNullOrUndefined(res.data())) {
        this.router.navigate(['page-not-found']);
      } else {
        this.product = res.data() as Bid;
        this.subtotal = this.product.price;
        this.total = this.subtotal + this.shippingPrice;
      }

      if (isPlatformBrowser(this._platformId)) {
        gtag('event', 'begin_checkout', {
          'event_category': 'ecommerce',
          'event_label': this.product.model
        });
      }
    });
  }

  checkUserAndTransaction(transactionID: string) {
    this.checkoutService.checkTransaction(transactionID).then(res => {
      if (res) {
        this.checkoutService.getTransaction(transactionID).subscribe(response => {
          this.product = response as Transaction;
          this.subtotal = this.product.price;
          this.total = this.subtotal + this.shippingPrice;
          this.initConfig();
        })
      } else {
        this.router.navigate(['page-not-found']);
      }
    });
  }

  sellNow() {
    this.checkoutService.sellTransactionApproved(this.product).then(res => {
      if (isPlatformBrowser(this._platformId)) {
        gtag('event', 'item_sold', {
          'event_category': 'ecommerce',
          'event_label': this.product.model,
          'event_value': this.product.price
        });
      }

      if (isBoolean(res)) {
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
    this.checkoutService.transactionApproved(this.product, '', this.shippingPrice, this.total, this.discount, this.discountCardID)
      .then(res => {
        if (isPlatformBrowser(this._platformId)) {
          gtag('event', 'purchase', {
            'event_category': 'ecommerce',
            'event_label': this.product.model,
            'event_value': this.product.price
          });
        }

        if (isBoolean(res)) {
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

    return subtotal * 0.095;
  }

  processing() {
    let subtotal = this.subtotal;

    return subtotal * 0.03;
  }

  goBack() {
    const id = this.product.model.toLowerCase();

    if (isNullOrUndefined(this.route.snapshot.queryParams.redirectTo)) {
      this.router.navigate([`product/${id.replace(/\s/g, '-').replace(/["'()]/g, '').replace(/\//g, '-')}`]);
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

  updateLastCartItem(product_id: string, size: string) {
    this.checkoutService.updateLastCartItem(this.userID, product_id, size);
  }

  private isUserConnected() {
    this.auth.isConnected().then(res => {
      if (!isNullOrUndefined(res)) {
        this.connected = true;
        this.userID = res.uid;

        if (!isUndefined(this.tID)) {
          this.checkUserAndTransaction(this.tID);
        } else {
          if (isNullOrUndefined(res.phoneNumber) && !isNullOrUndefined(this.route.snapshot.queryParams.product) && this.isSelling) {
            this.router.navigate(['/phone-verification'], {
              queryParams: { redirectTo: `product/${this.product.model.replace(/\s/g, '-').replace(/["'()]/g, '').replace(/\//g, '-').toLowerCase()}` }
            });
          }
        }
      } else {
        if (!isNullOrUndefined(this.tID)) {
          this.checkUserAndTransaction(this.tID);
        }
      }
    });
  }

  /*editShipping() {
    this.router.navigate(['../settings/shipping'], {
      queryParams: { redirectURI: 'checkout' }
    });
  }

  editPayment() {
    this.router.navigate(['../settings/buying'], {
      queryParams: { redirectURI: 'checkout' }
    });
  }*/
}
