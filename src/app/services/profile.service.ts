import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { User } from '../models/user';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/app';
import { isUndefined } from 'util';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService
  ) { }

  public async getUserData(): Promise<Observable<User>> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${UID}`);
    return userRef.valueChanges();
  }

  public async getUserListings(startAfter?): Promise<Observable<any>> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    let userRef: AngularFirestoreCollection<any>;

    if (isUndefined(startAfter)) {
      // tslint:disable-next-line: max-line-length
      userRef = this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.orderBy('timestamp', 'desc').limit(60));
    } else {
      // tslint:disable-next-line: max-line-length
      userRef = this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.orderBy('timestamp', 'desc').startAfter(startAfter).limit(60));
    }

    return userRef.valueChanges();
  }

  public async getUserOffers(startAfter?): Promise<Observable<any>> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    let userRef: AngularFirestoreCollection<any>;

    if (isUndefined(startAfter)) {
      // tslint:disable-next-line: max-line-length
      userRef = this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.orderBy('timestamp', 'desc').limit(60));
    } else {
      // tslint:disable-next-line: max-line-length
      userRef = this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.orderBy('timestamp', 'desc').startAfter(startAfter).limit(60));
    }

    return userRef.valueChanges();
  }

  public async getListing(listingID) {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    const offerRef: AngularFirestoreDocument<any> = this.afs.collection('users').doc(`${UID}`).collection('listings').doc(`${listingID}`);
    return offerRef.get();
  }

  public async updateListing(listing_id, product_id, old_price, condition, price, size): Promise<boolean> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    const batch = this.afs.firestore.batch();

    const listingRef = this.afs.firestore.collection('users').doc(`${UID}`).collection('listings').doc(`${listing_id}`);
    const askRef = this.afs.firestore.collection('products').doc(`${product_id}`).collection('listings').doc(`${listing_id}`);
    const prodRef = this.afs.firestore.collection(`products`).doc(`${product_id}`);

    let prices = [];

    await prodRef.collection(`listings`).orderBy(`price`, `asc`).limit(2).get().then(snap => {
      snap.forEach(ele => {
        prices.push(ele.data().price);
      });
    });

    await prodRef.get().then(snap => {
      if (isUndefined(prices[1]) || price < snap.data().lowestPrice) {
        batch.update(prodRef, {
          lowestPrice: price
        })
      } else if (old_price === snap.data().lowestPrice) {
        //console.log(`${prices[0]} and ${prices[1]}`)
        if (price < prices[1]) {
          batch.update(prodRef, {
            lowestPrice: price
          })
        } else {
          batch.update(prodRef, {
            lowestPrice: prices[1]
          })
        }
      }
    });

    batch.update(listingRef, {
      condition: condition,
      price: price,
      size: size
    });

    batch.update(askRef, {
      condition: condition,
      price: price,
      size: size
    });

    return batch.commit()
      .then(() => {
        //console.log('Listing updated');
        return true;
      })
      .catch((err) => {
        //console.error(err);
        return false;
      });
  }

  public async deleteListing(listingID, productID, price): Promise<boolean> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    const batch = this.afs.firestore.batch();

    const userListingRef = this.afs.firestore.collection('users').doc(`${UID}`).collection('listings').doc(`${listingID}`);
    const listingRef = this.afs.firestore.collection('products').doc(`${productID}`).collection('listings').doc(`${listingID}`);
    const userRef = this.afs.firestore.collection('users').doc(`${UID}`);

    batch.delete(userListingRef);
    batch.delete(listingRef);
    batch.update(userRef, {
      listed: firebase.firestore.FieldValue.increment(-1)
    });

    let prices = [];

    await this.afs.firestore.collection('products').doc(`${productID}`).collection(`listings`).orderBy(`price`, `asc`).limit(2).get().then(snap => {
      snap.forEach(data => {
        prices.push(data.data().price);
      });
    });

    // console.log(`length: ${prices.length}; price1: ${prices[0]}; price2: ${prices[1]}`);
    // console.log(prices);

    const prodRef = this.afs.firestore.collection(`products`).doc(`${productID}`);
    
    if (prices.length === 1) {
      //console.log('working');
      batch.update(prodRef, {
        lowestPrice: firebase.firestore.FieldValue.delete()
      });
    } else if (price === prices[0] && prices[0] != prices[1]) {
      batch.update(prodRef, {
        lowestPrice: prices[1]
      });
    }

    return batch.commit()
      .then(() => {
        //console.log('listing deleted');
        return true;
      })
      .catch((err) => {
        console.error(err);
        return false;
      });
  }
}
