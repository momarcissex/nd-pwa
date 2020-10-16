import { Component, OnInit } from '@angular/core';
import { Transaction } from 'src/app/models/transaction';
import { ActivatedRoute } from '@angular/router';
import { TransactionService } from 'src/app/services/transaction.service';
import { isNullOrUndefined } from 'util';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sold',
  templateUrl: './sold.component.html',
  styleUrls: ['./sold.component.scss']
})
export class SoldComponent implements OnInit {

  faExclamationCircle = faExclamationCircle

  transactionID: string;
  transaction: Transaction;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private TranService: TransactionService,
    private title: Title,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Item Sold | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Item Sold');

    this.transactionID = this.route.snapshot.queryParams.transactionID;

    if (isNullOrUndefined(this.transactionID)) {
      this.error = true;
    } else {
      this.TranService.checkTransaction(this.transactionID).subscribe(data => {
        this.transaction = data;

        if (this.transaction.type !== 'sold') {
          this.error = true;
        }
        // console.log(this.transaction);
      })
    }
  }

  fee() {
    let subtotal = this.transaction.price;

    return subtotal * 0.085;
  }

  processing() {
    let subtotal = this.transaction.price;

    return subtotal * 0.03;
  }

}
