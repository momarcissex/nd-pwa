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
  shipping_price = 15;
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

  product_id: string;
  model: string;        //name of the item user is checking out
  size: string;         //size of item user is checking out
  asset_url: string;    //location of item's asset
  price: number;        //price of item

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
            name: `${this.model}, size ${this.size}`,
            quantity: '1',
            category: 'PHYSICAL_GOODS',
            unit_amount: {
              currency_code: 'CAD',
              value: (this.total).toString(),
            },
          }],
          shipping: {
            name: {
              full_name: `${this.user.shipping_address.buying.first_name} ${this.user.shipping_address.buying.last_name}`,
            },
            address: {
              address_line_1: this.user.shipping_address.buying.street,
              address_line_2: this.user.shipping_address.buying.line2,
              admin_area_1: this.user.shipping_address.buying.province,
              admin_area_2: this.user.shipping_address.buying.city,
              postal_code: this.user.shipping_address.buying.postal_code,
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

          this.user.shipping_address.buying.street = details.purchase_units[0].shipping.address.address_line_1
          details.purchase_units[0].shipping.address.address_line_2 === undefined ? this.user.shipping_address.buying.line2 = '' : this.user.shipping_address.buying.line2 = details.purchase_units[0].shipping.address.address_line_2
          this.user.shipping_address.buying.city = details.purchase_units[0].shipping.address.admin_area_2
          this.user.shipping_address.buying.province = details.purchase_units[0].shipping.address.admin_area_1
          this.user.shipping_address.buying.postal_code = details.purchase_units[0].shipping.address.postal_code
          this.user.shipping_address.buying.country = details.purchase_units[0].shipping.address.country_code
          this.user.shipping_address.buying.first_name = details.payer.name.given_name
          this.user.shipping_address.buying.last_name = details.payer.name.surname

          this.userService.updateShippingInfo(this.user.uid, this.user.shipping_address.buying.first_name, this.user.shipping_address.buying.last_name, this.user.shipping_address.buying.street, this.user.shipping_address.buying.line2, this.user.shipping_address.buying.city, this.user.shipping_address.buying.province, this.user.shipping_address.buying.postal_code, this.user.shipping_address.buying.country, true)
        });
      },
      onClientAuthorization: (data) => {
        //console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
        let transaction;

        if (this.tID === undefined) {
          if (this.promoApplied) {
            transaction = this.tranService.transactionApproved(this.user.uid, this.product as Ask, this.user.shipping_address.buying, data.id, this.shipping_price, this.total, this.discount);
          } else {
            transaction = this.tranService.transactionApproved(this.user.uid, this.product as Ask, this.user.shipping_address.buying, data.id, this.shipping_price, this.total);
          }
        } else {
          if (this.promoApplied) {
            transaction = this.tranService.updateTransaction(this.user.uid, this.product as Transaction, data.id, this.user.shipping_address.buying, this.shipping_price, this.discount);
          } else {
            transaction = this.tranService.updateTransaction(this.user.uid, this.product as Transaction, data.id, this.user.shipping_address.buying, this.shipping_price);
          }
        }
        transaction.then(res => {
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
            //console.error(err);
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

        //console.log((this.total).toString())


        gtag('event', 'PP_click', {
          'event_category': 'ecommerce',
          'event_label': this.model
        });
      },
    };
  }

  applyPromo() {
    const now = Date.now();
    const code = (document.getElementById('promo-code') as HTMLInputElement).value

    /*this.discount = {
      amount: 5,
      cardID: 'DISCOUNT20',
      expirationDate: now,
      initiationDate: now,
      reusable: true,
      type: 'cash',
      used_by: []
    }

    if (this.price >= 100 && this.price < 200) {
      this.discount.amount = 15
      this.total = this.total - this.discount.amount
      this.promoApplied = true;
    } else if (this.price >= 200 && this.price < 300) {
      this.discount.amount = 16
      this.total = this.total - this.discount.amount
      this.promoApplied = true;
    } else if (this.price >= 300 && this.price < 400) {
      this.discount.amount = 17
      this.total = this.total - this.discount.amount
      this.promoApplied = true;
    } else if (this.price >= 400 && this.price < 500) {
      this.discount.amount = 18
      this.total = this.total - this.discount.amount
      this.promoApplied = true;
    } else if (this.price >= 500 && this.price < 800) {
      this.discount.amount = this.total * .04
      this.total = this.total - this.discount.amount
      this.promoApplied = true;
    } else if (this.price >= 800) {
      this.discount.amount = this.total * .05
      this.total = this.total - this.discount.amount
      this.promoApplied = true;
    }*/

    if (code.length == 10) {
      this.promoLoading = true;
      this.nxtdropCCService.getPromoCode(code).subscribe(res => {
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
        this.product_id = res.product_id
        this.model = res.model
        this.size = res.size
        this.asset_url = res.asset_url
        this.price = res.price
        this.subtotal = this.product.price;
        this.total = this.subtotal + this.shipping_price;

        if (isPlatformBrowser(this._platformId)) {
          gtag('event', 'begin_checkout', {
            'event_category': 'ecommerce',
            'event_label': this.product.model
          })
        }

        if (this.user != undefined) {
          this.updateLastCartItem(this.product_id, this.product.size, this.user)

          if (user != undefined) {
            if (user.phoneNumber === undefined && !(this.route.snapshot.queryParams.product === undefined) && this.isSelling) {
              this.router.navigate(['/phone-verification'], {
                queryParams: { redirectTo: `product/${this.product.model.replace(/\s/g, '-').replace(/["'()]/g, '').replace(/\//g, '-').toLowerCase()}` }
              });
            }
          }
        }

        this.showShipping()
        this.showCheckoutBtns()

        fbq('track', 'InitiateCheckout', {
          content_category: 'sneaker',
          content_ids: [`${this.product_id}`],
          contents: [{ 'id': `${this.product_id}`, 'quantity': '1' }],
          currency: 'CAD',
          num_item: 1,
          value: this.product.price + this.shipping_price
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
        this.product_id = res.product_id
        this.model = res.model
        this.size = res.size
        this.asset_url = res.asset_url
        this.price = res.price
        this.subtotal = this.product.price;
        this.total = this.subtotal + this.shipping_price;
      }

      if (isPlatformBrowser(this._platformId)) {
        gtag('event', 'begin_checkout', {
          'event_category': 'ecommerce',
          'event_label': res.model
        });

        if (user != undefined && user.phoneNumber === undefined && this.route.snapshot.queryParams.product != undefined && this.isSelling && user.email != 'admin@nxtdrop.com') {
          this.router.navigate(['/phone-verification'], {
            queryParams: { redirectTo: `product/${res.model.replace(/\s/g, '-').replace(/["'()]/g, '').replace(/\//g, '-').toLowerCase()}` }
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
      if (!(res == undefined) && !res.status.cancelled && res.payment_id === '') {
        this.product = res
        this.product_id = res.item.product_id
        this.model = res.item.model
        this.size = res.item.size
        this.asset_url = res.item.asset_url
        this.price = res.item.price
        this.subtotal = res.item.price
        this.total = this.subtotal + this.shipping_price
        this.initConfig()

        if (!(userID === undefined)) {
          this.userService.getUserInfo(userID).subscribe(data => {
            this.user = data
            this.connected = true

            if (!(data.uid == undefined)) {
              this.showShipping()
              this.showCheckoutBtns()
            }
          })
        } else {
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
    this.tranService.transactionApproved(this.user.uid, this.product as Ask, this.user.shipping_address.buying, this.discount.cardID, this.shipping_price, this.total, this.discount)
      .then(res => {
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
        //console.error(err);
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
    const id = this.product_id;

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

  updateLastCartItem(product_id: string, size: string, user: User) {
    this.userService.updateLastCartItem(user.uid, product_id, size);
  }

  private isUserConnected() {
    if (this.globals.user_data != undefined) {
      this.user = this.globals.user_data

      if (!(this.tID === undefined)) {
        this.checkUserAndTransaction(this.tID, this.user.uid);
      } else {
        if (this.isSelling != 'true') {
          this.isSelling = false;

          this.auth.isConnected().then(res => {
            this.getListing(this.route.snapshot.queryParams.product, res);
            this.initConfig();
          })
        } else {
          this.isSelling = true;

          this.auth.isConnected().then(res => {
            this.getOffer(this.route.snapshot.queryParams.product, res);
          })
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
        if (this.user.shipping_address === undefined) {
          this.showBuyingShipping = false
        } else if (!(this.user.shipping_address.buying === undefined)) {
          this.showBuyingShipping = true
        }
      } else if (this.isSelling) {
        if (this.user.shipping_address === undefined) {
          this.showSellingShipping = false
        } else if (!(this.user.shipping_address.selling === undefined)) {
          this.showSellingShipping = true
        }
      }

      this.showBuyingShipping || this.showSellingShipping ? this.showNoneShipping = false : this.showNoneShipping = true
    }
  }

  showCheckoutBtns() {
    this.showContinueShipping = this.showPaypal = this.showEditAsk = this.showEditBid = this.showConfirmSale = this.showConfirmPurchase = this.showLoginBtns = false

    if (this.user == undefined) {
      this.showLoginBtns = true
    } else {
      if (!(this.tID === undefined)) {
        const t = this.product as Transaction
        if (t.buyer_id === this.user.uid && this.user.shipping_address === undefined || this.user.shipping_address.buying === undefined) this.showContinueShipping = true
        else this.showPaypal = true
      } else if (this.isSelling) {
        const t = this.product as Bid
        if (t.buyer_id === this.user.uid) this.showEditBid = true
        else if (this.user.shipping_address === undefined || this.user.shipping_address.selling === undefined) this.showContinueShipping = true
        else this.showConfirmSale = true
      } else if (!this.isSelling) {
        const t = this.product as Ask
        if (t.seller_id === this.user.uid) this.showEditAsk = true
        else if (this.user.shipping_address === undefined || this.user.shipping_address.buying === undefined) this.showContinueShipping = true
        else if (this.total === 0) this.showConfirmPurchase = true
        else this.showPaypal = true
      }
    }
  }
}
