import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private auth: AuthService,
    private afs: AngularFirestore
  ) { }

  getProductInfo(productID) {
    return this.afs.collection('products').doc(`${productID}`).valueChanges();
  }

  getOffers(productID) {
    return this.afs.collection('products').doc(`${productID}`).collection('listings', ref => ref.orderBy(`size`, `asc`)).valueChanges();
  }

  async addToCart(listing) {
    let UID;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    const batch = this.afs.firestore.batch();
    const cartRef = this.afs.firestore.collection(`users`).doc(`${UID}`).collection(`cart`).doc(`${listing.listingID}`);
    const userRef = this.afs.firestore.collection(`users`).doc(`${UID}`);

    return cartRef.get().then(snap => {
      if (!snap.exists) {
        batch.set(cartRef, {
          listing
        });
    
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
}
