import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Product } from '../models/product';
import { AuthService } from './auth.service';
import * as firebase from 'firebase/app';
import { isUndefined, isNullOrUndefined } from 'util';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Ask } from '../models/ask';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SellService {

  ask_data: Ask;

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService,
    private http: HttpClient
  ) { }

  async addListing(pair: Product, condition: string, price: number, size: string, size_lowest_ask: number) {
    let UID: string;

    await this.auth.isConnected()
      .then(data => {
        UID = data.uid;
      });

    const timestamp = Date.now();
    const listingID = UID + '-' + timestamp;

    this.ask_data = {
      assetURL: pair.assetURL,
      model: pair.model,
      price,
      condition,
      size,
      productID: pair.productID,
      listingID,
      timestamp,
      sellerID: UID,
      created_at: timestamp,
      last_updated: timestamp
    };

    const batch = this.afs.firestore.batch();
    //console.log(timestamp);

    const userDocRef = this.afs.firestore.collection(`users/${UID}/listings`).doc(`${listingID}`);
    const prodDocRef = this.afs.firestore.collection(`products/${pair.productID}/listings`).doc(`${listingID}`);
    const listedValRef = this.afs.firestore.doc(`users/${UID}`);
    const askRef = this.afs.firestore.collection(`asks`).doc(`${listingID}`);

    batch.set(userDocRef, this.ask_data); // add Listing to User Document
    batch.set(askRef, this.ask_data); // add listing to asks collection
    batch.set(prodDocRef, this.ask_data); // add Listing to Products Document
    batch.set(listedValRef, {
      listed: firebase.firestore.FieldValue.increment(1)
    }, { merge: true }); // increment 'listed' field by one

    // update lowestprice in Product Document
    return this.afs.collection(`products`).doc(`${pair.productID}`).get().subscribe(res => {
      const lowestPrice = res.data().lowestPrice
      if (isUndefined(lowestPrice) || lowestPrice > price) {
        const productRef = this.afs.firestore.collection(`products`).doc(`${pair.productID}`);
        batch.set(productRef, {
          lowestPrice: price
        }, { merge: true });
      }

      return batch.commit()
        .then(() => {
          //console.log('New Listing Added');

          console.log(`size_lowest: ${size_lowest_ask} and price: ${price}`)

          if (isNullOrUndefined(size_lowest_ask) || price < size_lowest_ask) {
            this.http.put(`${environment.cloud.url}lowestAskNotification`, {
              product_id: pair.productID,
              seller_id: UID,
              condition,
              size,
              listing_id: listingID,
              price
            }).subscribe()
          }

          return true;
        })
        .catch((err) => {
          console.error(err);
          return false;
        });
    });
  }

  /*async getLowestPrice(productID: string) {
    const prodRef = await this.afs.collection(`products`).doc(`${productID}`);
    return prodRef.get();
  }*/

  getHighestOffer(productID: string, condition: string, size?: string) {
    let offerRef: firebase.firestore.Query<firebase.firestore.DocumentData>;

    isNullOrUndefined(size) ? offerRef = this.afs.collection(`products`).doc(`${productID}`).collection(`offers`).ref.where(`condition`, `==`, `${condition}`).orderBy(`price`, `desc`).limit(1) : offerRef = this.afs.collection(`products`).doc(`${productID}`).collection(`offers`).ref.where(`condition`, `==`, `${condition}`).where(`size`, `==`, `${size}`).orderBy(`price`, `desc`).limit(1);

    return offerRef.get() as Promise<firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>>;
  }

  getLowestListing(productID: string, condition: string, size?: string) {
    let listingRef: firebase.firestore.Query<firebase.firestore.DocumentData>;

    isNullOrUndefined(size) ? listingRef = this.afs.collection(`products`).doc(`${productID}`).collection(`listings`).ref.where(`condition`, `==`, `${condition}`).orderBy(`price`, `asc`).limit(1) : listingRef = this.afs.collection(`products`).doc(`${productID}`).collection(`listings`).ref.where(`condition`, `==`, `${condition}`).where(`size`, `==`, `${size}`).orderBy(`price`, `asc`).limit(1);

    return listingRef.get() as Promise<firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>>;
  }

}
