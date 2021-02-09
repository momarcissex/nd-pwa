import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from 'src/app/services/transaction.service';
import { Transaction } from 'src/app/models/transaction';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { AuthService } from 'src/app/services/auth.service';
import { User } from 'src/app/models/user';
import { HttpClient } from '@angular/common/http';
import { faCircleNotch, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

declare const gtag: any;

@Component({
  selector: 'app-transaction-review',
  templateUrl: './transaction-review.component.html',
  styleUrls: ['./transaction-review.component.scss']
})
export class TransactionReviewComponent implements OnInit {
  
  faCircleNotch = faCircleNotch
  faExclamationCircle = faExclamationCircle

  transactionID: string;
  transaction: Transaction;
  error = false;

  user: User;

  // boolean
  confLoading: boolean = false;
  cancelLoading: boolean = false;
  confError: boolean = false;
  cancelError: boolean = false;

  redirectTo: string;

  referralScript: boolean = false

  constructor(
    private route: ActivatedRoute,
    private TranService: TransactionService,
    private title: Title,
    private meta: MetaService,
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.title.setTitle(`Transaction Review | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Transaction Review');

    //console.log(this.referralScript)

    this.auth.isConnected().then(res => {
      if (res === undefined || this.route.snapshot.queryParams.transactionID === undefined) {
        this.error = true;
      } else {
        this.transactionID = this.route.snapshot.queryParams.transactionID;
        this.redirectTo = this.route.snapshot.queryParams.redirectTo;
        this.getData(res.uid);
      }
    });

    this.removeFreeShipping();
  }

  getData(UID: string) {
    this.TranService.checkTransaction(this.transactionID).subscribe(data => {
      if (data === undefined) {
        this.error = true
      } else {
        this.transaction = data;

        if (this.transaction.type !== 'bought' && this.transaction.type !== 'sold') {
          this.error = true;
        }

        this.getUserData(UID)
        //console.log(this.transaction);
      }
    })
  }

  getUserData(UID: string) {
    //console.log(UID)
    this.auth.getUserData(UID).subscribe(userData => {
      const date = Date.now()
      this.user = userData;
      //console.log(this.user)

      if (this.user.uid === this.transaction.buyerID && !(this.route.snapshot.queryParams.source === undefined) && date - this.transaction.purchaseDate <= 60000) {
        gtag('require', 'ecommerce', 'ecommerce.js')

        gtag('ecommerce:addTransaction', {
          'id':`${this.transaction.id}`,
          'revenue':`${this.transaction.total}`,
          'shipping':`${this.transaction.shippingCost}`,
          'currency':'CAD'
        })

        gtag('ecommerce:addItem', {
          'id':`${this.transaction.id}`,
          'name':`${this.transaction.model}`,
          'sku':`${this.transaction.productID}`,
          'category':`sneaker`,
          'price':`${this.transaction.price}`,
          'quantity':`1`,
          'currency':'CAD'
        })

        gtag('ecommerce:send')
      }
    });
  }

  removeFreeShipping() {
    this.TranService.removeFreeShipping();
  }

  confirmCancel() {
    if (!this.redirectTo) {
      this.router.navigate([`confirmation/${this.transactionID}/${this.user.uid}`], {
        queryParams: { redirectTo: 'transaction?transactionID=' + this.transactionID }
      })
    } else {
      this.router.navigate([`confirmation/${this.transactionID}/${this.user.uid}`], {
        queryParams: { redirectTo: 'transaction?transactionID=' + this.transactionID + '&redirectTo=' + this.redirectTo }
      })
    }
  }

  cancelOrder() {
    let cancellation;
    this.cancelLoading = true;

    if (this.user.uid === this.transaction.buyerID) {
      cancellation = this.TranService.cancelOrder(this.transactionID, this.transaction, false);
    } else {
      cancellation = this.TranService.cancelOrder(this.transactionID, this.transaction, true);
    }

    cancellation.then(res => {
      this.cancelLoading = false;
      if (!res) {
        this.cancelError = true;
      }

      setTimeout(() => {
        this.cancelError = false;
      }, 1500)
    })
  }

  trackOrder() {
    window.open(`https://www.canadapost.ca/track-reperage/en#/details/${this.transaction.shipTracking.trackingID}`)
  }

}
