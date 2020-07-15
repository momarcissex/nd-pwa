import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { User } from 'src/app/models/user';
import { Router, ActivatedRoute } from '@angular/router';
import { Transaction } from 'src/app/models/transaction';
import { SaleConfirmationService } from 'src/app/services/sale-confirmation.service';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-sale-confirmation',
  templateUrl: './sale-confirmation.component.html',
  styleUrls: ['./sale-confirmation.component.scss']
})
export class SaleConfirmationComponent implements OnInit {

  //seller fee
  consignmentFee: number = 0;
  paymentProcessingFee: number = 0;
  payout: number = 0;

  user: User; //seller info
  transactionData: Transaction;

  //boolean
  confLoading: boolean = false;
  confError: boolean = false;
  cancelLoading: boolean = false;
  cancelError: boolean = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private confService: SaleConfirmationService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.auth.isConnected().then(res => {
      if (!res) {
        this.router.navigate(['/login'], {
          queryParams: { redirectTo: this.router.url }
        })
      } else {
        this.getTransactionData(this.route.snapshot.params.id);
        this.getUserData(this.route.snapshot.params.seller);
      }
    });
  }

  getUserData(uid: string) {
    this.auth.getUserData(uid).subscribe((data: User) => {
      this.user = data;
      //console.log(this.user);
    })
  }

  getTransactionData(transactionId: string) {
    this.confService.transactionData(transactionId).subscribe((data: Transaction) => {
      this.transactionData = data;

      this.consignmentFee = this.transactionData.price * 0.085;
      this.paymentProcessingFee = this.transactionData.price * 0.03;
      this.payout = this.transactionData.price - this.consignmentFee - this.paymentProcessingFee;
      //console.log(this.transactionData);
    })
  }

  goToSettings() {
    this.router.navigate(['/settings/shipping'], {
      queryParams: { redirectURI: this.router.url }
    })
  }

  confirmOrder() {
    this.confLoading = true;

    this.confService.confirmOrder(this.route.snapshot.params.id).then(response => {
      this.confLoading = false;
      if (!response) {
        this.confError = true;

        setTimeout(() => {
          this.confError = false;
        }, 2000);
      } else {
        if (this.route.snapshot.queryParams.redirectTo) {
          setTimeout(() => {
            this.router.navigateByUrl(this.route.snapshot.queryParams.redirectTo)
          }, 2000);
        }
      }
    })
  }

  cancelOrder() {
    this.cancelLoading = true;

    this.confService.cancelOrder(this.route.snapshot.params.id, this.transactionData, true).then(response => {
      this.cancelLoading = true;
      if (!response) {
        this.cancelError = true;

        setTimeout(() => {
          this.cancelError = false;
        }, 2000);
      } else {
        if (this.route.snapshot.queryParams.redirectTo) {
          setTimeout(() => {
            this.router.navigateByUrl(this.route.snapshot.queryParams.redirectTo)
          }, 2000);
        }
      }
    })
  }

  addressExist() {
    if (isNullOrUndefined(this.user.shippingAddress)) {
      return false;
    } else if (isNullOrUndefined(this.user.shippingAddress.selling)) {
      return false;
    } else {
      return true;
    }
  }

}
