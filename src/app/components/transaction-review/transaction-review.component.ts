import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isNullOrUndefined } from 'util';
import { TransactionService } from 'src/app/services/transaction.service';
import { Transaction } from 'src/app/models/transaction';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { AuthService } from 'src/app/services/auth.service';
import { User } from 'src/app/models/user';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { NxtdropCC } from 'src/app/models/nxtdrop_cc';
import * as crypto from 'crypto-js';

@Component({
  selector: 'app-transaction-review',
  templateUrl: './transaction-review.component.html',
  styleUrls: ['./transaction-review.component.scss']
})
export class TransactionReviewComponent implements OnInit {

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
      if (isNullOrUndefined(res) || isNullOrUndefined(this.route.snapshot.queryParams.transactionID)) {
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
      if (isNullOrUndefined(data)) {
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

      if (this.user.uid === this.transaction.buyerID && !isNullOrUndefined(this.route.snapshot.queryParams.source) && date - this.transaction.purchaseDate <= 60000) {

        const script = document.createElement('script')

        script.innerHTML = "!function (d, s){var rc = \"//go.referralcandy.com/purchase/pdq6dcm70qh3iq8qtm4jmhb9q.js\";var js = d.createElement(s);js.src = rc;var fjs = d.getElementsByTagName(s)[0];fjs.parentNode.insertBefore(js, fjs);}(document, \"script\");"

        document.body.appendChild(script)

        if (!isNullOrUndefined(this.transaction.discount)) {
          const discount = this.transaction.discount as NxtdropCC

          const body = {
            accessID: environment.referralCandy.access_id,
            browser_ip: this.user.last_known_ip_address,
            currency_code: 'CAD',
            discount_code: discount.cardID,
            email: this.user.email,
            external_reference_id: this.transaction.id,
            first_name: this.user.firstName,
            invoice_amount: this.transaction.total,
            last_name: this.user.lastName,
            order_timestamp: this.transaction.purchaseDate,
            timestamp: date,
            signature: `${environment.referralCandy.secret_key}accessID=${environment.referralCandy.access_id}browser_ip=${this.user.last_known_ip_address}currency_code=CADdiscount_code=${discount.cardID}email=${this.user.email}external_reference_id=${this.transaction.id}first_name=${this.user.firstName}invoice_amount=${this.transaction.total}last_name=${this.user.lastName}order_timestamp=${this.transaction.purchaseDate}timestamp=${date}user_agent=${navigator.userAgent}`,
            user_agent: encodeURIComponent(navigator.userAgent)
          }

          this.http.post(`${environment.cloud.url}forwardPurchase`, body)

        } else {
          const body = {
            accessID: environment.referralCandy.access_id,
            browser_ip: this.user.last_known_ip_address,
            currency_code: 'CAD',
            email: this.user.email,
            external_reference_id: this.transaction.id,
            first_name: this.user.firstName,
            invoice_amount: this.transaction.total.toString(),
            last_name: this.user.lastName,
            order_timestamp: this.transaction.purchaseDate.toString(),
            timestamp: date.toString(),
            signature: crypto.MD5(`${environment.referralCandy.secret_key}accessID=${environment.referralCandy.access_id}browser_ip=${this.user.last_known_ip_address}currency_code=CADemail=${this.user.email}external_reference_id=${this.transaction.id}first_name=${this.user.firstName}invoice_amount=${this.transaction.total.toString()}last_name=${this.user.lastName}order_timestamp=${this.transaction.purchaseDate.toString()}timestamp=${date.toString()}user_agent=${navigator.userAgent}`).toString(),
            user_agent: navigator.userAgent
          }

          this.http.post(`${environment.cloud.url}forwardPurchase`, body).subscribe(
            res => {
              console.log(res)
            },
            err => {
              console.log(err)
            }
          )
        }
        //console.log(referralCandyData)
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
    window.open(`https://www.canadapost.ca/trackweb/en#/search?searchFor=${this.transaction.shipTracking.trackingID}`)
  }

}
