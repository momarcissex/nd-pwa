import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Transaction } from '../models/transaction';
import { SlackService } from './slack.service';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class SaleConfirmationService {

  constructor(
    private afs: AngularFirestore,
    private http: HttpClient,
    private slackService: SlackService
  ) { }

  transactionData(transactionId: string) {
    return this.afs.collection(`transactions`).doc(`${transactionId}`).valueChanges();
  }

  confirmOrder(transactionId: string, address: User['shipping_address']['selling']) {
    return this.afs.collection(`transactions`).doc(`${transactionId}`).set({
      status: {
        sellerConfirmation: true
      }
    }, { merge: true }).then(() => {
      this.slackService.sendAlert('seller_confirmation', `transactionID: ${transactionId}\nName: ${address.first_name} ${address.last_name}\nAddress: ${address.street} ${address.line2} ${address.city} ${address.province} ${address.postal_code} ${address.country}`)
      return true;
    }).catch(() => {
      return false;
    })
  }

  cancelOrder(transactionId: string, transactionData: Transaction, isSeller: boolean) {
    if (isSeller) {
      return this.afs.collection(`transactions`).doc(`${transactionId}`).set({
        cancellationNote: 'Seller cancelled the order.',
        status: {
          cancelled: true
        }
      }, { merge: true }).then(() => {
        transactionData.status.cancelled = true;
        transactionData.cancellation_note = 'Seller cancelled the order.';
        this.http.post(`${environment.cloud.url}orderCancellation`, transactionData).subscribe();
        return true;
      }).catch(() => {
        return false;
      })
    }
  }
}
