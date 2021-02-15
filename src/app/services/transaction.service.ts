import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction';
import { AuthService } from './auth.service';
import * as firebase from 'firebase/app';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SlackService } from './slack.service';
import { Bid } from '../models/bid';
import { User } from '../models/user';
import { Ask } from '../models/ask';
import { NxtdropCC } from '../models/nxtdrop_cc';
import { Globals } from '../globals';
import { ActivityService } from './activity.service';

declare const gtag: any;
declare const fbq: any;
@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService,
    private http: HttpClient,
    private slack: SlackService,
    private activityService: ActivityService,
    private globals: Globals
  ) { }

  /**
   * Create a transaction when a buyer makes a purchase
   * UID: seller's user ID
   * product: seller's ask or transction created when seller accepted bid
   * payment_id: the id from paypal representing the payment
   * shipping_cost: amount paid for shipping
   * total: total amount paid by the buyer
   * discount: amount discounted from total
   * 
   */
  async transactionApproved(UID: string, product: Ask, shippingInfo: User['shipping_address']['buying'], payment_id: string, shipping_cost: number, total: number, discount?: NxtdropCC) {
    const batch = firebase.firestore().batch()
    const id = product.product_id
    const boughtAt = Date.now()
    const transactionID = `${UID}-${product.seller_id}-${boughtAt}`

    const sellerRef = this.afs.firestore.collection(`users`).doc(`${product.seller_id}`) //seller doc ref
    const buyerRef = this.afs.firestore.collection(`users`).doc(`${UID}`) //buyer doc ref
    const prodRef = this.afs.firestore.collection(`products`).doc(`${id}`) //prod doc ref
    const tranRef = this.afs.firestore.collection(`transactions`).doc(`${transactionID}`) //transaction doc ref
    const askRef = this.afs.firestore.collection(`asks`) //ask collection ref

    //transaction data
    const transactionData: Transaction = {
      id: transactionID,
      item: product,
      total,
      buyer_id: UID,
      seller_id: product.seller_id,
      purchase_date: boughtAt,
      ship_tracking: {
        address: {
          recipient: `${shippingInfo.first_name} ${shippingInfo.last_name}`,
          street: shippingInfo.street,
          line2: shippingInfo.line2,
          city: shippingInfo.city,
          province: shippingInfo.province,
          postal_code: shippingInfo.postal_code,
          country: shippingInfo.country
        },
        label: '',
        carrier: '',
        tracking_id: ''
      },
      status: {
        verified: false,
        shipped: false,
        delivered: false,
        cancelled: false,
        shipped_for_verification: false,
        delivered_for_authentication: false,
        seller_confirmation: false
      },
      payment_id,
      shipping_cost,
      transaction_type: 'purchase'
    }

    //add discount to transaction data
    if (discount != undefined && discount.cardID != '') {
      if (discount.reusable) {
        transactionData.discount = discount
        const discountRef = this.afs.firestore.collection(`nxtcards`).doc(`${discount.cardID}`)
        batch.update(discountRef, {
          used_by: firebase.firestore.FieldValue.arrayUnion(UID)
        })
      } else {
        transactionData.discount = discount
        const discountRef = this.afs.firestore.collection(`nxtcards`).doc(`${discount.cardID}`)
        batch.update(discountRef, {
          amount: firebase.firestore.FieldValue.increment(-discount.amount)
        })
      }
    }

    let prices: Ask[] = []; //lowest asks
    let size_prices: Ask[] = [] //size lowest asks
    let userBid: Bid

    //get lowest two prices
    await prodRef.collection(`listings`).orderBy(`price`, `asc`).limit(2).get().then(snap => {
      snap.forEach(data => {
        prices.push(data.data() as Ask);
      })
    })

    //get two lowest prices in specific size
    await prodRef.collection(`listings`).where('size', '==', `${product.size}`).where('condition', '==', `${product.condition}`).orderBy(`price`, `asc`).limit(2).get().then(snap => {
      snap.forEach(ele => {
        size_prices.push(ele.data() as Ask);
      })
    })

    //get buyer's highest bid if applicable
    await buyerRef.collection('offers').where('product_id', '==', `${product.product_id}`).where('size', '==', `${product.size}`).orderBy('price', 'desc').limit(1).get().then(snap => {
      snap.forEach(data => {
        userBid = data.data() as Bid
      })
    })

    //delete or update lowest_price
    if (prices.length === 1) {
      batch.update(prodRef, {
        lowest_price: firebase.firestore.FieldValue.delete()
      });
    } else if (product.price === prices[0].price && prices[0].price != prices[1].price) {
      batch.update(prodRef, {
        lowest_price: prices[1].price
      })
    }

    // delete listings
    batch.delete(sellerRef.collection(`listings`).doc(`${product.listing_id}`))
    batch.delete(prodRef.collection(`listings`).doc(`${product.listing_id}`))
    batch.delete(askRef.doc(`${product.listing_id}`))

    // update ordered and sold fields
    batch.update(buyerRef, {
      ordered: firebase.firestore.FieldValue.increment(1),
      last_item_in_cart: firebase.firestore.FieldValue.delete()
    });
    batch.update(sellerRef, {
      listed: firebase.firestore.FieldValue.increment(-1),
      sold: firebase.firestore.FieldValue.increment(1),
    })

    // add transaction doc to  transactions collection
    batch.set(tranRef, transactionData)

    //remove buyer's highest bid
    if (userBid != undefined) {
      let p: Bid[] = []

      await prodRef.collection(`offers`).orderBy(`price`, `desc`).limit(2).get().then(snap => {
        snap.forEach(data => {
          p.push(data.data() as Bid);
        })
      })

      //delete or update highest_bid
      if (p.length === 1) {
        batch.update(prodRef, {
          highest_bid: firebase.firestore.FieldValue.delete()
        });
      } else if (userBid.price === p[0].price && p[0].price != p[1].price) {
        batch.update(prodRef, {
          highest_bid: p[1].price
        })
      }

      batch.delete(sellerRef.collection('offers').doc(`${userBid.offer_id}`))
      batch.delete(prodRef.collection('offers').doc(`${userBid.offer_id}`))
      batch.delete(this.afs.firestore.collection(`bids`).doc(`${userBid.offer_id}`))
      batch.update(buyerRef, {
        offers: firebase.firestore.FieldValue.increment(-1)
      })
    }

    // track if item purchased is a product from recently_viewed component
    if (this.globals.recently_viewed_clicks.includes(product.product_id)) {
      gtag('event', 'purchase_recently_viewed', {
        'event_category': 'exp004',
        'event_label': product.product_id
      })
    }

    //track page user came from
    if (this.globals.landing_page != undefined) {
      gtag('event', 'sale', {
        'event_category': "landing_page",
        'event_label': this.globals.landing_page
      })
    }

    //commit the transaction
    return batch.commit()
      .then(() => {
        this.activityService.logActivity(product.product_id, 'purchase')

        //send alert to slack
        this.slack.sendAlert('sales', `${UID} bought ${product.model}, size ${product.size} at ${product.price} from ${product.seller_id}`).catch(err => {
          //console.error(err)
        }) //send notification to slack

        this.http.post(`${environment.cloud.url}orderConfirmation`, transactionData).subscribe() //send email notification

        this.http.patch(`${environment.cloud.url}updateContact`, {
          uid: transactionData.buyer_id,
          mode: 'purchase'
        }).subscribe()

        //send event to google analytics
        gtag('event', 'item_bought', {
          'event_category': 'ecommerce',
          'event_label': product.model,
          'event_value': product.price
        });

        //send event to facebook pixel
        fbq('track', 'Purchase', {
          content_ids: [`${product.product_id}`],
          content_name: product.model,
          content_type: 'sneaker',
          contents: [{ 'id': `${product.product_id}`, 'quantity': '1' }],
          currency: 'CAD',
          num_items: 1,
          value: product.price + shipping_cost
        })

        if (this.globals.exp003_version != undefined) {
          gtag('event', `${this.globals.exp003_version}_purchase`, {
            'event_category': `exp003`,
            'event_label': `${product.model}`,
            'event_value': `${product.price}`
          })
        }

        if (this.globals.exp001_version != undefined) {
          gtag('event', `${this.globals.exp001_version}_purchase`, {
            'event_category': 'exp001',
            'event_label': `${product.model}`,
            'event_value': `${product.price}`
          })
        }

        if (product.listing_id === size_prices[0].listing_id && size_prices[1] != undefined) {
          this.http.put(`${environment.cloud.url}lowestAskNotification`, {
            product_id: size_prices[1].product_id,
            seller_id: size_prices[1].seller_id,
            condition: size_prices[1].condition,
            size: size_prices[1].size,
            listing_id: size_prices[1].listing_id,
            price: size_prices[1].price
          }).subscribe()
        }

        return transactionID //return transaction_id
      })
      .catch(err => {
        console.error(err)
        return false
      })
  }

  /**
   * Create a transaction when a seller accepts a bid
   * @param UID the seller's user ID
   * @param product the buyer's Bid
   * @returns a promise contaning a boolean when the transaction failed and the transaction's ID if sucessful
   */
  async sellTransactionApproved(UID: string, product: Bid): Promise<string | boolean> {
    const batch = firebase.firestore().batch()
    const purchase_date = Date.now()
    const transactionID = `${product.buyer_id}-${UID}-${purchase_date}`
    const shipping_cost = 15

    const buyerRef = this.afs.firestore.collection(`users`).doc(`${product.buyer_id}`) //buyer doc ref
    const sellerRef = this.afs.firestore.collection(`users`).doc(`${UID}`) //seller doc ref
    const prodRef = this.afs.firestore.collection(`products`).doc(`${product.buyer_id}`) //prod doc ref
    const tranRef = this.afs.firestore.collection(`transactions`).doc(`${transactionID}`) //transaction doc ref
    const bidRef = this.afs.firestore.collection('bids') //bid collection ref

    //transaction data
    const transactionData: Transaction = {
      id: transactionID,
      item: product,
      total: product.price + shipping_cost,
      shipping_cost,
      seller_id: UID,
      buyer_id: product.buyer_id,
      purchase_date,
      ship_tracking: {
        address: {
          recipient: ``,
          street: '',
          line2: '',
          city: '',
          province: '',
          postal_code: '',
          country: ''
        },
        label: '',
        carrier: '',
        tracking_id: ''
      },
      status: {
        verified: false,
        shipped: false,
        delivered: false,
        cancelled: false,
        shipped_for_verification: false,
        delivered_for_authentication: false,
        seller_confirmation: true
      },
      payment_id: '',
      transaction_type: 'bid_accepted'
    }

    let prices: Bid[] = [] //highest bids
    let size_prices: Bid[] = [] //size highest bids
    let userAsk: Ask

    //get two highest bids
    await prodRef.collection(`offers`).orderBy(`price`, `desc`).limit(2).get().then(snap => {
      snap.forEach(data => {
        prices.push(data.data() as Bid);
      })
    })

    //get two highest prices in specific size
    await prodRef.collection(`offers`).where('size', '==', `${product.size}`).where('condition', '==', `${product.condition}`).orderBy(`price`, `desc`).limit(2).get().then(snap => {
      snap.forEach(ele => {
        size_prices.push(ele.data() as Bid);
      })
    })

    //get seller's lowest ask if applicable
    await sellerRef.collection('listings').where('product_id', '==', `${product.product_id}`).where('size', '==', `${product.size}`).orderBy('price', 'asc').limit(1).get().then(snap => {
      snap.forEach(data => {
        userAsk = data.data() as Ask
      })
    })

    //delete or update highest_bid
    if (prices.length === 1) {
      batch.update(prodRef, {
        highest_bid: firebase.firestore.FieldValue.delete()
      });
    } else if (product.price === prices[0].price && prices[0].price != prices[1].price) {
      batch.update(prodRef, {
        highest_bid: prices[1].price
      })
    }

    // delete listings
    batch.delete(buyerRef.collection(`offers`).doc(`${product.offer_id}`))
    batch.delete(prodRef.collection(`offers`).doc(`${product.offer_id}`))
    batch.delete(bidRef.doc(`${product.offer_id}`))

    // set ordered and sol fields
    batch.set(buyerRef, {
      ordered: firebase.firestore.FieldValue.increment(1),
      offers: firebase.firestore.FieldValue.increment(-1)
    }, { merge: true })
    batch.set(sellerRef, {
      sold: firebase.firestore.FieldValue.increment(1)
    }, { merge: true })

    // add transaction doc to  transactions collection
    batch.set(tranRef, transactionData)

    //remove seller's lowest ask
    if (userAsk != undefined) {
      let p: Ask[] = []
      //get lowest two prices
      await prodRef.collection(`listings`).orderBy(`price`, `asc`).limit(2).get().then(snap => {
        snap.forEach(data => {
          p.push(data.data() as Ask);
        })
      })

      //delete or update lowest_price
      if (p.length === 1) {
        batch.update(prodRef, {
          lowest_price: firebase.firestore.FieldValue.delete()
        });
      } else if (userAsk.price === p[0].price && p[0].price != p[1].price) {
        batch.update(prodRef, {
          lowest_price: p[1].price
        })
      }


      batch.delete(sellerRef.collection('listings').doc(`${userAsk.listing_id}`))
      batch.delete(prodRef.collection('listings').doc(`${userAsk.listing_id}`))
      batch.delete(this.afs.firestore.collection(`asks`).doc(`${userAsk.listing_id}`))
      batch.update(sellerRef, {
        listed: firebase.firestore.FieldValue.increment(-1)
      })
    }

    // track if bid accepted on a product from recently_viewed component
    if (this.globals.recently_viewed_clicks.includes(product.product_id)) {
      gtag('event', 'bid_accepted_recently_viewed', {
        'event_category': 'exp004',
        'event_label': product.product_id
      })
    }

    //track page user came from
    if (this.globals.landing_page != undefined) {
      gtag('event', 'bid_accepted', {
        'event_category': "landing_page",
        'event_label': this.globals.landing_page
      })
    }

    //commit the transaction
    return batch.commit()
      .then(() => {
        this.activityService.logActivity(product.product_id, 'purchase')

        //send alert to slack
        this.slack.sendAlert('sales', `${UID} sold ${product.model}, size ${product.size} at ${product.price} to ${product.buyer_id}`).catch(err => {
          //console.error(err)
        })

        //send event to google analytics
        gtag('event', 'item_sold', {
          'event_category': 'ecommerce',
          'event_label': product.model,
          'event_value': product.price
        });

        if (this.globals.exp001_version != undefined) {
          if (this.globals.exp001_version == 'exp001a') {
            gtag('event', 'exp001a_bid_accepted', {
              'event_category': 'exp001',
              'event_label': `${product.model}`,
              'event_value': `${product.price}`
            })
          } else if (this.globals.exp001_version == 'exp001b') {
            gtag('event', 'exp001b_bid_accepted', {
              'event_category': 'exp001',
              'event_label': `${product.model}`,
              'event_value': `${product.price}`
            })
          } else if (this.globals.exp001_version == 'exp001c') {
            gtag('event', 'exp001c_bid_accepted', {
              'event_category': 'exp001',
              'event_label': `${product.model}`,
              'event_value': `${product.price}`
            })
          } else if (this.globals.exp001_version == 'exp001d') {
            gtag('event', 'exp001d_bid_accepted', {
              'event_category': 'exp001',
              'event_label': `${product.model}`,
              'event_value': `${product.price}`
            })
          }
        }

        if (product.offer_id === size_prices[0].offer_id && size_prices[1] != undefined) {
          this.http.put(`${environment.cloud.url}highestBidNotification`, {
            product_id: size_prices[1].product_id,
            buyer_id: size_prices[1].buyer_id,
            condition: size_prices[1].condition,
            size: size_prices[1].size,
            offer_id: size_prices[1].offer_id,
            price: size_prices[1].price
          }).subscribe()
        }

        this.http.post(`${environment.cloud.url}orderConfirmation`, transactionData).subscribe(); //send order confirmation email

        return transactionID; //return transaction_id
      })
      .catch(err => {
        console.error(err);
        return false;
      })
  }

  /**
   * Update a transaction when a buyer checkout after his bid was accepted
   * @param userID the buyer's user ID
   * @param paymentID the id from paypal representing the payment
   * @param shippingInfo the buyer's shipping address
   * @param shippingCost amount paid for shipping
   * @param transaction_id the transaction's ID
   * @param discount the discount card used during this transaction (Optional)
   * @returns a promise contaning a boolean when the transaction failed and the transaction's ID if sucessful
   */
  async updateTransaction(userID: string, transaction: Transaction, payment_id: string, shippingInfo: User['shipping_address']['buying'], shipping_cost: number, discount?: NxtdropCC): Promise<string | boolean> {
    const tranRef = this.afs.firestore.collection(`transactions`).doc(`${transaction.id}`); //transaction doc ref
    const batch = firebase.firestore().batch();

    //update transaction doc
    batch.update(tranRef, {
      purchaseDate: Date.now(),
      payment_id,
      shipping_cost,
      ship_tracking: {
        address: {
          recipient: `${shippingInfo.first_name} ${shippingInfo.last_name}`,
          street: shippingInfo.street,
          line2: shippingInfo.line2,
          city: shippingInfo.city,
          province: shippingInfo.province,
          postal_code: shippingInfo.postal_code,
          country: shippingInfo.country
        },
        label: '',
        carrier: '',
        tracking_id: ''

      }
    });

    //add discount if applicable
    if (discount != undefined) {
      batch.update(tranRef, {
        discount,
        total: firebase.firestore.FieldValue.increment(-discount.amount)
      });

      if (!discount.reusable) {
        const discountRef = this.afs.firestore.collection(`nxtcards`).doc(`${discount.cardID}`);
        batch.update(discountRef, {
          amount: firebase.firestore.FieldValue.increment(-discount.amount)
        });
      } else {
        const discountRef = this.afs.firestore.collection(`nxtcards`).doc(`${discount.cardID}`);
        batch.update(discountRef, {
          used_by: firebase.firestore.FieldValue.arrayUnion(userID)
        });
      }
    }

    //commit transaction
    return batch.commit()
      .then(() => {
        //console.log('Transaction Approved');

        //send event to google analytics
        gtag('event', 'item_bought', {
          'event_category': 'ecommerce',
          'event_label': transaction.item.model,
          'event_value': transaction.item.price
        });

        //send event to facebook pixel
        fbq('track', 'Purchase', {
          content_ids: [`${transaction.item.product_id}`],
          content_name: transaction.item.model,
          content_type: 'sneaker',
          contents: [{ 'id': `${transaction.item.product_id}`, 'quantity': '1' }],
          currency: 'CAD',
          num_items: 1,
          value: transaction.item.price + shipping_cost
        })

        if (this.globals.exp003_version != undefined) {
          gtag('event', `${this.globals.exp003_version}_purchase`, {
            'event_category': `exp003`,
            'event_label': `${transaction.item.model}`,
            'event_value': `${transaction.item.price}`
          })
        }

        if (this.globals.exp001_version != undefined) {
          gtag('event', `${this.globals.exp001_version}_purchase`, {
            'event_category': 'exp001',
            'event_label': `${transaction.item.model}`,
            'event_value': `${transaction.item.price}`
          })
        }

        return transaction.id; //return transaction_id
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
        free_shipping: firebase.firestore.FieldValue.delete()
      }, { merge: true }).catch(err => {
        console.error(err);
      })
    });
  }
}
