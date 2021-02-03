import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Bid } from '../models/bid';
import { Product } from '../models/product';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import * as firebase from 'firebase/app';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Globals } from '../globals';
import { ActivityService } from './activity.service';

declare const gtag: any;
@Injectable({
  providedIn: 'root'
})
export class BidService {

  bid_data: Bid;

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService,
    private http: HttpClient,
    private activityService: ActivityService,
    private globals: Globals
  ) { }

  public getBid(offerID): Observable<Bid> {
    return this.afs.collection('bids').doc(`${offerID}`).valueChanges() as Observable<Bid>
  }

  public checkUserBid(productID: string, size: string, uid: string, condition: string) {
    return this.afs.collection('bids', ref => ref.where('productID', '==', productID).where('buyerID', '==', uid).where('size', '==', size).where('condition', '==', condition)).valueChanges() as Observable<Bid[]>
  }

  public getHighestBid(productID: string, condition: string, size?: string) {
    let offerRef: firebase.firestore.Query<firebase.firestore.DocumentData>;

    (size == undefined || size == null) ? offerRef = this.afs.collection(`products`).doc(`${productID}`).collection(`offers`).ref.where(`condition`, `==`, `${condition}`).orderBy(`price`, `desc`).limit(1) : offerRef = this.afs.collection(`products`).doc(`${productID}`).collection(`offers`).ref.where(`condition`, `==`, `${condition}`).where(`size`, `==`, `${size}`).orderBy(`price`, `desc`).limit(1);

    return offerRef.get() as Promise<firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>>;
  }

  async submitBid(UID: string, pair: Product, condition: string, price: number, size: string, size_highest_bid: number, expiration_date: number) {
    const created_at = Date.now();
    const offerID = UID + '-' + created_at;

    this.bid_data = {
      assetURL: pair.assetURL,
      model: pair.model,
      price,
      condition,
      size,
      productID: pair.productID,
      offerID,
      buyerID: UID,
      last_updated: created_at,
      created_at,
      expiration_date
    };

    const batch = this.afs.firestore.batch();

    const userDocRef = this.afs.firestore.collection(`users/${UID}/offers`).doc(`${offerID}`);
    const prodDocRef = this.afs.firestore.collection(`products/${pair.productID}/offers`).doc(`${offerID}`);
    const offersValRef = this.afs.firestore.doc(`users/${UID}`);
    const bidRef = this.afs.firestore.collection(`bids`).doc(`${offerID}`);

    batch.set(userDocRef, this.bid_data);
    batch.set(prodDocRef, this.bid_data);
    batch.set(bidRef, this.bid_data); // add offer to offers collection
    batch.set(offersValRef, {
      offers: firebase.firestore.FieldValue.increment(1)
    }, { merge: true })

    // track if bid was placed on a product from recently_viewed component
    if (this.globals.recently_viewed_clicks.includes(pair.productID)) {
      gtag('event', 'bid_placed_recently_viewed', {
        'event-category': 'exp004',
        'event-label': pair.productID
      })
    }

    // update highestBid in products Document
    return this.afs.collection('products').doc(`${pair.productID}`).get().subscribe(res => {
      if ((res.data().highest_bid == undefined || res.data().highest_bid == null) || res.data().highest_bid < price) {
        const prodRef = this.afs.firestore.collection('products').doc(`${pair.productID}`);

        batch.set(prodRef, {
          highest_bid: price
        }, { merge: true })
      }

      return batch.commit()
        .then(() => {
          this.activityService.logActivity(pair.productID, 'bid_placed')

          console.log(`size highest_bid: ${size_highest_bid} and price: ${price}`)

          if ((size_highest_bid == undefined || size_highest_bid == null) || price > size_highest_bid) {
            this.http.put(`${environment.cloud.url}highestBidNotification`, {
              product_id: pair.productID,
              buyer_id: UID,
              condition,
              size,
              offer_id: offerID,
              price
            }).subscribe()
          }

          this.http.post(`${environment.cloud.url}bidNotification`, this.bid_data).subscribe()

          return true;
        })
        .catch((err) => {
          console.error(err);
          return false;
        })
    })
  }

  public async deleteBid(bid: Bid) {
    const batch = this.afs.firestore.batch();

    const userBidRef = this.afs.firestore.collection('users').doc(`${bid.buyerID}`).collection('offers').doc(`${bid.offerID}`);
    const prodBidRef = this.afs.firestore.collection('products').doc(`${bid.productID}`).collection('offers').doc(`${bid.offerID}`);
    const userRef = this.afs.firestore.collection('users').doc(`${bid.buyerID}`);
    const bidRef = this.afs.firestore.collection(`bids`).doc(`${bid.offerID}`);
    this.bid_data = bid

    batch.delete(userBidRef) //remove bid in user document
    batch.delete(prodBidRef) //remove bid in prod document
    batch.delete(bidRef) //remove bid bid collection
    batch.update(userRef, {
      offers: firebase.firestore.FieldValue.increment(-1)
    });

    const prodRef = this.afs.firestore.collection('products').doc(`${bid.productID}`);
    let prices: Bid[] = []
    let size_prices: Bid[] = []

    await prodRef.collection('offers').orderBy('price', 'desc').limit(2).get().then(snap => {
      snap.forEach(data => {
        prices.push(data.data() as Bid)
      })
    })

    await prodRef.collection(`offers`).where('size', '==', `${bid.size}`).where('condition', '==', `${bid.condition}`).orderBy(`price`, `desc`).limit(2).get().then(snap => {
      snap.forEach(ele => {
        size_prices.push(ele.data() as Bid)
      })
    })

    if (prices.length === 1) {
      batch.update(prodRef, {
        highest_bid: firebase.firestore.FieldValue.delete()
      })
    } else if (bid.price === prices[0].price && prices[0].price != prices[1].price) {
      batch.update(prodRef, {
        highest_bid: prices[1].price
      })
    }

    return batch.commit()
      .then(() => {
        //console.log('Offer deleted');
        console.log(`offerID: ${bid.offerID}; size[0]: ${size_prices[0].offerID}`)
        console.log(`size[1]: ${size_prices[1]}`)

        if (bid.offerID === size_prices[0].offerID && !(size_prices[1] == undefined || size_prices[1] == null)) {
          console.log(size_prices[1])
          this.http.put(`${environment.cloud.url}highestBidNotification`, {
            product_id: size_prices[1].productID,
            buyer_id: size_prices[1].buyerID,
            condition: size_prices[1].condition,
            size: size_prices[1].size,
            offer_id: size_prices[1].offerID,
            price: size_prices[1].price
          }).subscribe()
        }

        this.http.put(`${environment.cloud.url}bidNotification`, this.bid_data).subscribe()

        return true;
      })
      .catch((err) => {
        console.error(err)
        return false
      })
  }

  public async updateBid(bid: Bid, price: number, expiration_date: number): Promise<boolean> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid
    })

    const batch = this.afs.firestore.batch();
    const last_updated = Date.now()

    const userBidRef = this.afs.firestore.collection('users').doc(`${UID}`).collection('offers').doc(`${bid.offerID}`);
    const prodBidRef = this.afs.firestore.collection('products').doc(`${bid.productID}`).collection('offers').doc(`${bid.offerID}`);
    const bidRef = this.afs.firestore.collection(`bids`).doc(`${bid.offerID}`);

    const prodRef = this.afs.firestore.collection(`products`).doc(`${bid.productID}`);
    let prices: Bid[] = []
    let size_prices: Bid[] = []

    await prodRef.collection(`offers`).orderBy(`price`, `desc`).limit(2).get().then(snap => {
      snap.forEach(ele => {
        prices.push(ele.data() as Bid)
      })
    })

    await prodRef.collection(`offers`).where('size', '==', `${bid.size}`).where('condition', '==', `${bid.condition}`).orderBy(`price`, `desc`).limit(2).get().then(snap => {
      snap.forEach(ele => {
        size_prices.push(ele.data() as Bid)
      })
    })

    if (prices.length === 1) {
      batch.update(prodRef, {
        highest_bid: price
      })
    } else {
      //console.log(`price1: ${prices[0]}; price2: ${prices[1]}; price: ${price}; old_price: ${old_price}`)
      if (price > prices[0].price) {
        batch.update(prodRef, {
          highest_bid: price
        })
      } else if (bid.price === prices[0].price && price <= prices[1].price) {
        batch.update(prodRef, {
          highest_bid: prices[1].price
        })
      } else if (bid.price === prices[0].price && price > prices[1].price) {
        batch.update(prodRef, {
          highest_bid: price
        })
      }
    }

    batch.update(bidRef, {
      condition: bid.condition,
      price: price,
      size: bid.size,
      last_updated,
      expiration_date
    })

    batch.update(userBidRef, {
      condition: bid.condition,
      price: price,
      size: bid.size,
      last_updated,
      expiration_date
    })

    batch.update(prodBidRef, {
      condition: bid.condition,
      price: price,
      size: bid.size,
      last_updated,
      expiration_date
    })

    return batch.commit()
      .then(() => {
        this.activityService.logActivity(bid.productID, 'bid_placed')

        this.sendHighestBidNotification(price, bid.condition, bid.size, UID, bid.productID, bid.offerID, size_prices)

        this.bid_data = {
          assetURL: bid.assetURL,
          condition: bid.condition,
          offerID: bid.offerID,
          model: bid.model,
          productID: bid.productID,
          price: bid.price,
          buyerID: bid.buyerID,
          size: bid.size,
          created_at: bid.created_at
        }

        this.http.patch(`${environment.cloud.url}bidNotification`, this.bid_data).subscribe()

        return true;
      })
      .catch((err) => {
        console.error(err)
        return false
      })
  }

  sendHighestBidNotification(price: number, condition: string, size: string, UID: string, product_id: string, offer_id: string, size_prices: Bid[]) {
    if (price > size_prices[0].price) {
      this.http.put(`${environment.cloud.url}highestBidNotification`, {
        product_id,
        buyer_id: UID,
        condition,
        size,
        offer_id,
        price
      }).subscribe()
    } else if (!(size_prices[1] == undefined || size_prices[1] == null) && offer_id === size_prices[0].offerID && price < size_prices[0].price) {
      if (price <= size_prices[1].price) {
        this.http.put(`${environment.cloud.url}highestBidNotification`, {
          product_id,
          buyer_id: size_prices[1].buyerID,
          condition,
          size,
          offer_id: size_prices[1].offerID,
          price: size_prices[1].price
        }).subscribe()
      } else if (price > size_prices[1].price) {
        this.http.put(`${environment.cloud.url}highestBidNotification`, {
          product_id,
          buyer_id: UID,
          condition,
          size,
          offer_id,
          price
        }).subscribe()
      }
    } else if (size_prices[1] == undefined || size_prices[1] == null) {
      this.http.put(`${environment.cloud.url}highestBidNotification`, {
        product_id,
        buyer_id: UID,
        condition,
        size,
        offer_id,
        price
      }).subscribe()
    }
  }

  public extendBid(bid: Bid) {
    const data: Bid = bid
    const new_date = Date.now()
    const batch = this.afs.firestore.batch()

    data.expiration_date = new_date + (86400000 * ((data.expiration_date - data.last_updated) / 86400000 - 1))
    data.last_updated = new_date

    batch.set(this.afs.firestore.collection('products').doc(data.productID).collection('offers').doc(data.offerID), data)
    batch.update(this.afs.firestore.collection('bids').doc(data.offerID), data)
    batch.update(this.afs.firestore.collection('users').doc(data.buyerID).collection('offers').doc(data.offerID), data)

    return batch.commit()
      .then(() => {
        return data;
      })
      .catch(err => {
        console.error(err)

        return false;
      })
  }
}
