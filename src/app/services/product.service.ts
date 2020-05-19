import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import { isNull } from 'util';
import { Observable } from 'rxjs';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private auth: AuthService,
    private afs: AngularFirestore
  ) { }

  getProductInfo(productID) {
    return this.afs.collection('products').doc(`${productID}`).ref.get();
  }

  getBuy(productID) {
    return this.afs.collection('products').doc(`${productID}`).collection('listings', ref => ref.orderBy(`size`, `asc`)).valueChanges();
  }

  getOffers(productID) {
    return this.afs.collection('products').doc(`${productID}`).collection('offers', ref => ref.orderBy(`size`, `asc`)).valueChanges();
  }

  async addToCart(listing) {
    let UID;
    await this.auth.isConnected().then(data => {
      if (!isNull(data)) {
        UID = data.uid;
      } else {
        return false;
      }
    });

    const data = {
      assetURL: listing.assetURL,
      model: listing.model,
      price: listing.price,
      condition: listing.condition,
      size: listing.size,
      listingID: listing.listingID,
      timestamp: Date.now()
    }

    const batch = this.afs.firestore.batch();
    const cartRef = this.afs.firestore.collection(`users`).doc(`${UID}`).collection(`cart`).doc(`${listing.listingID}`);
    const userRef = this.afs.firestore.collection(`users`).doc(`${UID}`);

    return cartRef.get().then(snap => {
      if (!snap.exists) {
        batch.set(cartRef, data);
    
        batch.set(userRef, {
          cartItems: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });

        return batch.commit()
          .then(() => {
            return true;
          })
          .catch((err) => {
            console.error(err);
            return false;
          });
      } else {
        return false;
      }
    });
  }

  countView(productID: string) {
    return this.afs.firestore.collection('products').doc(`${productID}`).update({
      views: firebase.firestore.FieldValue.increment(1)
    });
  }
}
