import { Component, OnInit } from '@angular/core';
import { DashboardService } from 'src/app/services/dashboard.service';
import { AuthService } from 'src/app/services/auth.service';
import { isUndefined, isNullOrUndefined } from 'util';
import { User } from 'src/app/models/user';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  UID: string;
  user: User;
  purchases = [];
  sales = [];

  //Boolean
  showPurchases: boolean = true;
  showSales: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private auth: AuthService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.auth.isConnected().then(res => {
      if (!isUndefined(res)) {
        this.UID = res.uid;

        this.getUserData();

        if (!isNullOrUndefined(this.route.snapshot.params.id) && this.route.snapshot.params.id == 'sales') {
          this.getSales();
        } else {
          this.getPurchases();
        }
      }
    });
  }

  getUserData() {
    this.dashboardService.userData(this.UID).subscribe((data: User) => {
      this.user = data;
      //console.log(data);
    });
  }

  getPurchases() {
    document.getElementById(`purchase-btn`).classList.add('active');
    document.getElementById(`sales-btn`).classList.remove('active');
    this.showPurchases = true;
    this.showSales = false;

    if (this.purchases.length === 0) {
      this.dashboardService.purchases(this.UID).subscribe(data => {
        data.forEach(doc => {
          this.purchases.push(doc.data());
        })
      });
    }
  }

  getSales() {
    document.getElementById(`purchase-btn`).classList.remove('active');
    document.getElementById(`sales-btn`).classList.add('active');
    this.showSales = true;
    this.showPurchases = false;

    if (this.sales.length === 0) {
      this.dashboardService.sales(this.UID).subscribe(data => {
        data.forEach(doc => {
          this.sales.push(doc.data());
        })
      });
    }
  }

  printOrderStatus(status) {
    if (status.cancelled) {
      return 'cancelled'
    } else if (isNullOrUndefined(status.sellerConfirmation) && !status.shippedForVerification && !status.deliveredForAuthentication && !status.verified && !status.shipped && !status.delivered && !status.cancelled) {
      return 'awaiting seller confirmation'
    } else if (!status.shippedForVerification && status.sellerConfirmation && !status.deliveredForAuthentication && !status.verified && !status.shipped && !status.delivered && !status.cancelled) {
      return 'waiting for seller to ship'
    } else if (status.shippedForVerification && !status.deliveredForAuthentication && !status.verified && !status.shipped && !status.delivered && !status.cancelled) {
      return 'en route to NXTDROP'
    } else if (status.shippedForVerification && status.deliveredForAuthentication && !status.verified && !status.shipped && !status.delivered && !status.cancelled) {
      return 'delivered to NXTDROP'
    } else if (status.shippedForVerification && status.deliveredForAuthentication && status.verified && !status.shipped && !status.delivered && !status.cancelled) {
      return 'authentication passed'
    } else if (status.shippedForVerification && status.deliveredForAuthentication && status.verified && status.shipped && !status.delivered && !status.cancelled) {
      return 'shipped to buyer'
    } else if (status.shippedForVerification && status.deliveredForAuthentication && status.verified && status.shipped && status.delivered && !status.cancelled) {
      return 'delivered to buyer'
    }
  }

  more() {
    if (this.showSales) {
      this.dashboardService.sales(this.UID, this.sales[this.sales.length - 1].purchaseDate).subscribe(data => {
        this.sales.concat(data.docs);
      })
    } else {
      this.dashboardService.purchases(this.UID, this.sales[this.sales.length - 1].purchaseDate).subscribe(data => {
        this.sales.concat(data.docs);
      })
    }
  }

}
