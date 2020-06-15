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
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { AskService } from 'src/app/services/ask.service';
import { BidService } from 'src/app/services/bid.service';

declare const gtag: any;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  public payPalConfig?: IPayPalConfig;

  shippingInfo: User['shippingAddress']['buying']

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
    private slack: SlackService,
    private userService: UserService,
    private tranService: TransactionService,
    private askService: AskService,
    private bidService: BidService
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
              full_name: `${this.shippingInfo.firstName} ${this.shippingInfo.lastName}`
            },
            address: {
              address_line_1: this.shippingInfo.street,
              address_line_2: this.shippingInfo.line2,
              admin_area_1: this.shippingInfo.province,
              admin_area_2: this.shippingInfo.city,
              postal_code: this.shippingInfo.postalCode,
              country_code: 'CA'
            }
          }
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

          this.shippingInfo.street = details.purchase_units[0].shipping.address.address_line_1
          isNullOrUndefined(details.purchase_units[0].shipping.address.address_line_2) ? this.shippingInfo.line2 = '' : this.shippingInfo.line2 = details.purchase_units[0].shipping.address.address_line_2
          this.shippingInfo.city = details.purchase_units[0].shipping.address.admin_area_2
          this.shippingInfo.province = details.purchase_units[0].shipping.address.admin_area_1
          this.shippingInfo.postalCode = details.purchase_units[0].shipping.address.postal_code
          this.shippingInfo.country = details.purchase_units[0].shipping.address.country_code
          this.shippingInfo.firstName = details.payer.name.given_name
          this.shippingInfo.lastName = details.payer.name.surname

          this.userService.updateShippingInfo(this.userID, this.shippingInfo.firstName, this.shippingInfo.lastName, this.shippingInfo.street, this.shippingInfo.line2, this.shippingInfo.city, this.shippingInfo.province, this.shippingInfo.postalCode, this.shippingInfo.country, true)
        });
      },
      onClientAuthorization: (data) => {
        //console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
        let transaction;

        if (isUndefined(this.tID)) {
          if (this.promoApplied) {
            transaction = this.tranService.transactionApproved(this.userID, this.product as Ask, this.shippingInfo, data.id, this.shippingPrice, this.total, this.discount, this.discountCardID);
          } else {
            transaction = this.tranService.transactionApproved(this.userID, this.product as Ask, this.shippingInfo, data.id, this.shippingPrice, this.total);
          }
        } else {
          if (this.promoApplied) {
            transaction = this.tranService.updateTransaction(data.id, this.shippingInfo, this.shippingPrice, this.tID, this.discount, this.discountCardID);
          } else {
            transaction = this.tranService.updateTransaction(data.id, this.shippingInfo, this.shippingPrice, this.tID);
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

  getListing(listingID: string) {
    this.isUserConnected()

    this.askService.getAsk(listingID).subscribe(res => {
      if (isNullOrUndefined(res)) {
        this.router.navigate(['page-not-found']);
      } else {
        this.product = res;
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

    this.bidService.getBid(offerID).subscribe(res => {
      if (isNullOrUndefined(res)) {
        this.router.navigate(['page-not-found']);
      } else {
        this.product = res;
        this.subtotal = this.product.price;
        this.total = this.subtotal + this.shippingPrice;

        this.userService.getUserInfo(this.userID).subscribe(data => {
          if (!isNullOrUndefined(data.shippingAddress) && !isNullOrUndefined(data.shippingAddress.buying)) {
            this.shippingInfo = data.shippingAddress.selling
          }
        })
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
    this.tranService.checkTransaction(transactionID).subscribe(res => {
      if (!isNullOrUndefined(res) && !res.status.cancelled && res.paymentID === '') {
        this.product = res
        this.subtotal = this.product.price
        this.total = this.subtotal + this.shippingPrice
        this.initConfig()

        this.userService.getUserInfo(this.userID).subscribe(data => {
          if (!isNullOrUndefined(data.shippingAddress) && !isNullOrUndefined(data.shippingAddress.buying)) {
            this.shippingInfo = data.shippingAddress.buying
          }
        })
      } else {
        this.router.navigate(['page-not-found']);
      }
    })
  }

  sellNow() {
    this.tranService.sellTransactionApproved(this.userID, this.product as Bid).then(res => {
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
    this.tranService.transactionApproved(this.userID, this.product as Ask, this.shippingInfo, this.discountCardID, this.shippingPrice, this.total, this.discount, this.discountCardID)
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
    this.userService.updateLastCartItem(this.userID, product_id, size);
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

          if (!this.isSelling) {
            this.userService.getUserInfo(this.userID).subscribe(data => {
              if (!isNullOrUndefined(data.shippingAddress) && !isNullOrUndefined(data.shippingAddress.buying)) {
                this.shippingInfo = data.shippingAddress.buying
              }
            })
          }
        }
      } else {
        if (!isNullOrUndefined(this.tID)) {
          this.checkUserAndTransaction(this.tID);
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

  /*editPayment() {
    this.router.navigate(['../settings/buying'], {
      queryParams: { redirectURI: 'checkout' }
    });
  }*/
}
