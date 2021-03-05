import { Component, OnInit } from '@angular/core';
import { DashboardService } from 'src/app/services/dashboard.service';
import { AuthService } from 'src/app/services/auth.service';
import { User } from 'src/app/models/user';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Transaction } from 'src/app/models/transaction';
import { Globals } from 'src/app/globals';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  user: User;
  purchases: Transaction[] = [];
  sales: Transaction[] = [];

  //Boolean
  showPurchases: boolean = true;
  showSales: boolean = false;

  constructor(
    private dashboardService: DashboardService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private title: Title,
    private globals: Globals
  ) { }

  ngOnInit() {
    this.title.setTitle('Dashboard | NXTDROP')
    if (this.globals.uid == undefined) {
      this.router.navigate(['login'], {
        queryParams: { redirectTo: this.router.url }
      });
    } else {
      this.user = this.globals.user_data

      if (!(this.route.snapshot.params.id === undefined) && this.route.snapshot.params.id == 'sales') {
        this.getSales();
      } else {
        this.getPurchases();
      }
    }
  }

  getPurchases() {
    //console.log('run getPurchases')
    document.getElementById(`purchase-btn`).classList.add('active');
    document.getElementById(`sales-btn`).classList.remove('active');
    this.showPurchases = true;
    this.showSales = false;

    if (this.purchases.length === 0) {
      this.dashboardService.purchases(this.user.uid).then(data => {
        data.forEach(d => {
          this.purchases.push(d.data() as Transaction)
        })
      });
    }
  }

  getSales() {
    //console.log('run getSales')
    document.getElementById(`purchase-btn`).classList.remove('active');
    document.getElementById(`sales-btn`).classList.add('active');
    this.showSales = true;
    this.showPurchases = false;

    if (this.sales.length === 0) {
      this.dashboardService.sales(this.user.uid).then((data: any) => {
        data.forEach(d => {
          this.sales.push(d.data() as Transaction)
        })
      });
    }
  }

  printOrderStatus(transaction: Transaction) {
    if (transaction.transaction_type == 'purchase') {
      if (transaction.status.seller_confirmation === undefined || !transaction.status.seller_confirmation && !transaction.status.shipped_for_verification && !transaction.status.delivered_for_authentication && !transaction.status.verified && !transaction.status.shipped && !transaction.status.delivered && !transaction.status.cancelled) {
        return 'waiting for seller to ship'
      }
    } else {
      if (transaction.payment_id === '') {
        return 'waiting buyer to checkout'
      }
    }

    if (transaction.status.cancelled) {
      if (transaction.status.shipped_for_verification && transaction.status.delivered_for_authentication && transaction.status.verified && !transaction.status.shipped && !transaction.status.delivered) return 'Authentication Failed'
      else return 'Cancelled'
    } else if (!transaction.status.shipped_for_verification && transaction.status.seller_confirmation && !transaction.status.delivered_for_authentication && !transaction.status.verified && !transaction.status.shipped && !transaction.status.delivered && !transaction.status.cancelled) {
      return 'Waiting for Seller to Ship'
    } else if (transaction.status.shipped_for_verification && !transaction.status.delivered_for_authentication && !transaction.status.verified && !transaction.status.shipped && !transaction.status.delivered && !transaction.status.cancelled) {
      return 'Shipped to NXTDROP'
    } else if (transaction.status.shipped_for_verification && transaction.status.delivered_for_authentication && !transaction.status.verified && !transaction.status.shipped && !transaction.status.delivered && !transaction.status.cancelled) {
      return 'Awaiting Authentication'
    } else if (transaction.status.shipped_for_verification && transaction.status.delivered_for_authentication && transaction.status.verified && !transaction.status.shipped && !transaction.status.delivered && !transaction.status.cancelled) {
      if (this.globals.uid == transaction.buyer_id) return 'Authentication Passed'
      else return 'Payout pending'
    } else if (transaction.status.shipped_for_verification && transaction.status.delivered_for_authentication && transaction.status.verified && transaction.status.shipped && !transaction.status.delivered && !transaction.status.cancelled) {
      if (this.globals.uid == transaction.buyer_id) return 'Shipped to You'
      else return 'Complete'
    } else if (transaction.status.shipped_for_verification && transaction.status.delivered_for_authentication && transaction.status.verified && transaction.status.shipped && transaction.status.delivered && !transaction.status.cancelled) {
      if (this.globals.uid == transaction.buyer_id) return 'Delivered'
      else return 'Complete'
    }
  }

  more() {
    if (this.showSales) {
      this.dashboardService.sales(this.user.uid, this.sales[this.sales.length - 1].purchase_date).then((data: any) => {
        this.sales.concat(data.docs);
      })
    } else {
      this.dashboardService.purchases(this.user.uid, this.sales[this.sales.length - 1].purchase_date).then((data: any) => {
        this.purchases.concat(data.docs);
      })
    }
  }

}
