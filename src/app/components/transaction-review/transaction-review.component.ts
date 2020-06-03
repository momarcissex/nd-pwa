import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isNullOrUndefined } from 'util';
import { TransactionService } from 'src/app/services/transaction.service';
import { Transaction } from 'src/app/models/transaction';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { AuthService } from 'src/app/services/auth.service';
import { User } from 'src/app/models/user';

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

  constructor(
    private route: ActivatedRoute,
    private TranService: TransactionService,
    private title: Title,
    private meta: MetaService,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.title.setTitle(`Transaction Review | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Transaction Review');

    this.auth.isConnected().then(res => {
      if (isNullOrUndefined(res) || isNullOrUndefined(this.route.snapshot.queryParams.transactionID)) {
        this.error = true;
      } else {
        this.transactionID = this.route.snapshot.queryParams.transactionID;
        this.redirectTo = this.route.snapshot.queryParams.redirectTo;
        this.getData();
        this.getUserData(res.uid);
      }
    });

    this.removeFreeShipping();
  }

  getData() {
    this.TranService.getTransaction(this.transactionID).subscribe(data => {
      this.transaction = data;

      if (this.transaction.type !== 'bought' && this.transaction.type !== 'sold') {
        this.error = true;
      }
      //console.log(this.transaction);
    })
  }

  getUserData(UID: string) {
    //console.log(UID)
    this.auth.getUserData(UID).subscribe(userData => {
      this.user = userData;
      //console.log(this.user)
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

}
