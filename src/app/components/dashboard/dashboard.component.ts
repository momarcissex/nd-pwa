import { Component, OnInit } from '@angular/core';
import { DashboardService } from 'src/app/services/dashboard.service';
import { AuthService } from 'src/app/services/auth.service';
import { User } from 'src/app/models/user';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Transaction } from 'src/app/models/transaction';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  UID: string;
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
    private title: Title
  ) { }

  ngOnInit() {
    this.title.setTitle('Dashboard | NXTDROP')
    this.auth.isConnected().then(res => {
      if (!(res === undefined)) {
        this.UID = res.uid;

        this.getUserData();

        if (!(this.route.snapshot.params.id === undefined) && this.route.snapshot.params.id == 'sales') {
          this.getSales();
        } else {
          this.getPurchases();
        }
      } else {
        this.router.navigate(['login'], {
          queryParams: { redirectTo: this.router.url }
        });
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
    //console.log('run getPurchases')
    document.getElementById(`purchase-btn`).classList.add('active');
    document.getElementById(`sales-btn`).classList.remove('active');
    this.showPurchases = true;
    this.showSales = false;

    if (this.purchases.length === 0) {
      this.dashboardService.purchases(this.UID).subscribe((data: any) => {
        data.forEach(doc => {
          const d = doc as Transaction;
          d.id = doc.id;
          this.purchases.push(d);
          //console.log(d)
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
      this.dashboardService.sales(this.UID).subscribe((data: any) => {
        data.forEach(doc => {
          const d = doc as Transaction;
          d.id = doc.id;
          this.sales.push(d);
          //console.log(d)
        })
      });
    }
  }

  printOrderStatus(status: Transaction["status"], type: string, paymentID: string) {
    //console.log(`${type}, ${id}, ${paymentID}`)
    if (type == 'bought') {
      if (status.sellerConfirmation === undefined || !status.sellerConfirmation && !status.shippedForVerification && !status.deliveredForAuthentication && !status.verified && !status.shipped && !status.delivered && !status.cancelled) {
        return 'waiting for seller to ship'
      }
    } else {
      if (paymentID === '') {
        return 'waiting buyer to checkout'
      }
    }

    if (status.cancelled) {
      if (status.shippedForVerification && status.deliveredForAuthentication && status.verified && !status.shipped && !status.delivered) return 'authentication failed'
      else return 'cancelled'
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
      this.dashboardService.sales(this.UID, this.sales[this.sales.length - 1].purchaseDate).subscribe((data: any) => {
        this.sales.concat(data.docs);
      })
    } else {
      this.dashboardService.purchases(this.UID, this.sales[this.sales.length - 1].purchaseDate).subscribe((data: any) => {
        this.sales.concat(data.docs);
      })
    }
  }

}
