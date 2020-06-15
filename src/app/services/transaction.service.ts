import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction';
import { AuthService } from './auth.service';
import * as firebase from 'firebase/app';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { isNullOrUndefined } from 'util';
import { SlackService } from './slack.service';
import { Bid } from '../models/bid';
import { User } from '../models/user';
import { Ask } from '../models/ask';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService,
    private http: HttpClient,
    private slack: SlackService
  ) { }

  /**
   * Create a transaction when a buyer makes a purchase
   * UID: seller's user ID
   * product: seller's ask or transction created when seller accepted bid
   * paymentID: the id from paypal representing the payment
   * shippingCost: amount paid for shipping
   * total: total amount paid by the buyer
   * discount: amount discounted from total
   * 
   */
  async transactionApproved(UID: string, product: Ask, shippingInfo: User['shippingAddress']['buying'], paymentID: string, shippingCost: number, total: number, discount?: number, discountCardID?: string) {
    const batch = firebase.firestore().batch();
    const id = product.model.replace(/\s/g, '-').replace(/["'()]/g, '').replace(/\//g, '-').toLowerCase();
    const boughtAt = Date.now();
    const transactionID = `${UID}-${product.sellerID}-${boughtAt}`;

    const sellerRef = this.afs.firestore.collection(`users`).doc(`${product.sellerID}`); //seller doc ref
    const buyerRef = this.afs.firestore.collection(`users`).doc(`${UID}`); //buyer doc ref
    const prodRef = this.afs.firestore.collection(`products`).doc(`${id}`); //prod doc ref
    const tranRef = this.afs.firestore.collection(`transactions`).doc(`${transactionID}`); //transaction doc ref
    const askRef = this.afs.firestore.collection(`asks`); //ask collection ref

    //transaction data
    const transactionData: Transaction = {
      id: transactionID,
      assetURL: product.assetURL,
      condition: product.condition,
      listingID: product.listingID,
      productID: id,
      model: product.model,
      price: product.price,
      total,
      sellerID: product.sellerID,
      buyerID: UID,
      size: product.size,
      listedAt: product.timestamp,
      purchaseDate: boughtAt,
      shipTracking: {
        address: {
          recipient: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          line1: shippingInfo.street,
          line2: shippingInfo.line2,
          city: shippingInfo.city,
          province: shippingInfo.province,
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country
        },
        label: '',
        carrier: '',
        trackingID: ''
      },
      status: {
        verified: false,
        shipped: false,
        delivered: false,
        cancelled: false,
        shippedForVerification: false,
        deliveredForAuthentication: false,
        sellerConfirmation: false
      },
      paymentID,
      shippingCost,
      type: 'bought'
    };

    //add discount to transaction data
    if (!isNullOrUndefined(discount)) {
      transactionData.discount = discount
      transactionData.discountCardID = discountCardID
      const discountRef = this.afs.firestore.collection(`nxtcards`).doc(`${discountCardID}`)
      batch.update(discountRef, {
        amount: firebase.firestore.FieldValue.increment(-discount)
      })
    }

    let prices = []; //lowest prices

    //get lowest two prices
    await this.afs.firestore.collection('products').doc(`${id}`).collection(`listings`).orderBy(`price`, `asc`).limit(2).get().then(snap => {
      snap.forEach(data => {
        prices.push(data.data().price);
      });
    });

    //delete or update lowest_price
    if (prices.length === 1) {
      batch.update(prodRef, {
        lowestPrice: firebase.firestore.FieldValue.delete()
      });
    } else {
      batch.set(prodRef, {
        lowestPrice: prices[1]
      }, { merge: true });
    }

    // delete listings
    batch.delete(sellerRef.collection(`listings`).doc(`${product.listingID}`));
    batch.delete(prodRef.collection(`listings`).doc(`${product.listingID}`));
    batch.delete(askRef.doc(`${product.listingID}`));

    // update ordered and sold fields
    batch.update(buyerRef, {
      ordered: firebase.firestore.FieldValue.increment(1),
      last_item_in_cart: firebase.firestore.FieldValue.delete()
    });
    batch.update(sellerRef, {
      listed: firebase.firestore.FieldValue.increment(-1),
      sold: firebase.firestore.FieldValue.increment(1),
    });

    // add transaction doc to  transactions collection
    batch.set(tranRef, transactionData, { merge: true })

    //commit the transaction
    return batch.commit()
      .then(() => {
        //console.log('Transaction Approved');

        //send alert to slack
        this.slack.sendAlert('sales', `${UID} bought ${product.model}, size ${product.size} at ${product.price} from ${product.sellerID}`).catch(err => {
          //console.error(err)
        });

        this.http.post(`${environment.cloud.url}orderConfirmation`, transactionData).subscribe(); //send email notification

        return transactionID; //return transaction_id
      })
      .catch(err => {
        console.error(err);
        return false;
      })
  }

  /**
   * Create a transaction when a seller accepts a bid
   * UID: seller's user ID
   * product: buyer's Bid
   */
  async sellTransactionApproved(UID: string, product: Bid): Promise<string | boolean> {
    const batch = firebase.firestore().batch();
    const id = product.model.replace(/\s/g, '-').replace(/["'()]/g, '').replace(/\//g, '-').toLowerCase();
    const purchaseDate = Date.now();
    const transactionID = `${product.buyerID}-${UID}-${purchaseDate}`;
    const shippingCost = 15;

    const buyerRef = this.afs.firestore.collection(`users`).doc(`${product.buyerID}`); //buyer doc ref
    const sellerRef = this.afs.firestore.collection(`users`).doc(`${UID}`); //seller doc ref
    const prodRef = this.afs.firestore.collection(`products`).doc(`${id}`); //prod doc ref
    const tranRef = this.afs.firestore.collection(`transactions`).doc(`${transactionID}`); //transaction doc ref
    const bidRef = this.afs.firestore.collection('bids'); //bid collection ref

    //transaction data
    const transactionData: Transaction = {
      id: transactionID,
      assetURL: product.assetURL,
      condition: product.condition,
      offerID: product.offerID,
      productID: id,
      model: product.model,
      price: product.price,
      total: product.price + shippingCost,
      shippingCost,
      sellerID: UID,
      buyerID: product.buyerID,
      size: product.size,
      listedAt: product.timestamp,
      purchaseDate,
      shipTracking: {
        address: {
          recipient: ``,
          line1: '',
          line2: '',
          city: '',
          province: '',
          postalCode: '',
          country: ''
        },
        label: '',
        carrier: '',
        trackingID: ''
      },
      status: {
        verified: false,
        shipped: false,
        delivered: false,
        cancelled: false,
        shippedForVerification: false,
        deliveredForAuthentication: false,
        sellerConfirmation: true
      },
      paymentID: '',
      type: 'sold'
    };

    // delete listings
    batch.delete(buyerRef.collection(`offers`).doc(`${product.offerID}`));
    batch.delete(prodRef.collection(`offers`).doc(`${product.offerID}`));
    batch.delete(bidRef.doc(`${product.offerID}`));

    // set ordered and sol fields
    batch.set(buyerRef, {
      ordered: firebase.firestore.FieldValue.increment(1),
      offers: firebase.firestore.FieldValue.increment(-1)
    }, { merge: true });
    batch.set(sellerRef, {
      sold: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });

    // add transaction doc to  transactions collection
    batch.set(tranRef, transactionData, { merge: true })

    //commit the transaction
    return batch.commit()
      .then(() => {
        //console.log('Transaction Approved');

        //send alert to slack
        this.slack.sendAlert('sales', `${UID} sold ${product.model}, size ${product.size} at ${product.price} to ${product.buyerID}`).catch(err => {
          //console.error(err)
        });

        this.http.post(`${environment.cloud.url}orderConfirmation`, transactionData).subscribe(); //send order confirmation email

        return transactionID; //return transaction_id
      })
      .catch(err => {
        //console.error(err);
        return false;
      })
  }

  /**
   * Update a transaction when a buyer checkout after his bid was accepted
   * paymentID: the id from paypal representing the payment
   * shippingCost: amount paid for shipping
   * transaction_id: id of transaction
   * discount: amount discounted from total
   * discountCardID: ID of discount card used to make purchase
   */
  async updateTransaction(paymentID: string, shippingInfo: User['shippingAddress']['buying'], shippingCost: number, transaction_id: string, discount?: number, discountCardID?: string): Promise<string | boolean> {
    const tranRef = this.afs.firestore.collection(`transactions`).doc(`${transaction_id}`); //transaction doc ref
    const batch = firebase.firestore().batch();

    //update transaction doc
    batch.update(tranRef, {
      paymentID,
      shippingCost,
      shipTracking: {
        address: {
          recipient: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          line1: shippingInfo.street,
          line2: shippingInfo.line2,
          city: shippingInfo.city,
          province: shippingInfo.province,
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country
        }
      }
    });

    //add discount if applicable
    if (!isNullOrUndefined(discount)) {
      batch.update(tranRef, {
        discount,
        discountCardID,
        total: firebase.firestore.FieldValue.increment(-discount)
      });

      const discountRef = this.afs.firestore.collection(`nxtcards`).doc(`${discountCardID}`);
      batch.update(discountRef, {
        amount: firebase.firestore.FieldValue.increment(-discount)
      });
    }

    //commit transaction
    return batch.commit()
      .then(() => {
        //console.log('Transaction Approved');
        return transaction_id; //return transaction_id
      })
      .catch(err => {
        //console.error(err);
        return false;
      })

  }

  /*public getTransaction(transactionID: string): Observable<Transaction> {
    return this.afs.collection(`transactions`).doc(`${transactionID}`).valueChanges() as Observable<Transaction>;
  }*/

  public checkTransaction(transactionID: string) {
    return this.afs.collection(`transactions`).doc(`${transactionID}`).valueChanges() as Observable<Transaction>
  }

  public removeFreeShipping() {
    this.auth.isConnected().then(res => {
      this.afs.collection(`users`).doc(`${res.uid}`).set({
        freeShipping: firebase.firestore.FieldValue.delete()
      }, { merge: true }).catch(err => {
        console.error(err);
      })
    });
  }

  public async confirmOrder(transactionID: string) {
    return this.afs.collection(`transactions`).doc(`${transactionID}`).update({
      'status.sellerConfirmation': true
    }).then(() => {
      return true;
    }).catch(() => {
      return false;
    })
  }

  public async cancelOrder(transactionID: string, transactionData: Transaction, isSeller: boolean) {
    let cancellationNote: string;

    if (isSeller) {
      cancellationNote = 'Seller cancelled the order';
    } else {
      cancellationNote = 'Buyer cancelled the order';
    }

    return this.afs.collection(`transactions`).doc(`${transactionID}`).set({
      status: {
        cancelled: true
      },
      cancellationNote
    }, { merge: true }).then(() => {
      transactionData.cancellationNote = cancellationNote;
      transactionData.status.cancelled = true;
      this.http.post(`${environment.cloud.url}orderCancellation`, transactionData).subscribe();
      return true;
    }).catch(() => {
      return false;
    })
  }
}
