import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Product } from '../models/product';
import { AuthService } from './auth.service';
import { Ask } from '../models/ask';
import * as firebase from 'firebase/app';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AskService {

  ask_data: Ask;

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService,
    private http: HttpClient
  ) { }

  public getAsk(listing_id: string): Observable<Ask> {
    return this.afs.collection('asks').doc(`${listing_id}`).valueChanges() as Observable<Ask>
  }

  getLowestAsk(productID: string, condition: string, size?: string) {
    let listingRef: firebase.firestore.Query<firebase.firestore.DocumentData>;

    size == undefined || size == null ? listingRef = this.afs.collection(`products`).doc(`${productID}`).collection(`listings`).ref.where(`condition`, `==`, `${condition}`).orderBy(`price`, `asc`).limit(1) : listingRef = this.afs.collection(`products`).doc(`${productID}`).collection(`listings`).ref.where(`condition`, `==`, `${condition}`).where(`size`, `==`, `${size}`).orderBy(`price`, `asc`).limit(1);

    return listingRef.get() as Promise<firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>>
  }

  async submitAsk(pair: Product, condition: string, price: number, size: string, expiration_date: number) {
    let UID: string
    let sizeLowestAskNotif: Observable<any>

    await this.auth.isConnected()
      .then(data => {
        UID = data.uid
      })

    const created_at = Date.now();
    const listingID = UID + '-' + created_at;

    this.ask_data = {
      assetURL: pair.assetURL,
      model: pair.model,
      price,
      condition,
      size,
      productID: pair.productID,
      listingID,
      sellerID: UID,
      created_at,
      last_updated: created_at,
      expiration_date
    }

    const batch = this.afs.firestore.batch()
    //console.log(timestamp);

    const userDocRef = this.afs.firestore.collection(`users/${UID}/listings`).doc(`${listingID}`)
    const listingRef = this.afs.firestore.collection(`products/${pair.productID}/listings`).doc(`${listingID}`)
    const listedValRef = this.afs.firestore.doc(`users/${UID}`)
    const askRef = this.afs.firestore.collection(`asks`).doc(`${listingID}`)
    const prodRef = this.afs.firestore.collection('products').doc(pair.productID)

    batch.set(userDocRef, this.ask_data); // add Listing to User Document
    batch.set(askRef, this.ask_data); // add listing to asks collection
    batch.set(listingRef, this.ask_data); // add Listing to Products Document
    batch.set(listedValRef, {
      listed: firebase.firestore.FieldValue.increment(1)
    }, { merge: true }) // increment 'listed' field by one

    //update lowest_price
    if ((pair.lowest_price == undefined || pair.lowest_price == null) || price < pair.lowest_price) {
      batch.update(prodRef, {
        lowest_price: price
      })
    }

    //send email notif and update size_lowest_price
    if (pair.sizes_lowest_ask[size] == 0 || (pair.sizes_lowest_ask[size] > 0 && price < pair.sizes_lowest_ask[size])) {
      sizeLowestAskNotif = this.http.put(`${environment.cloud.url}lowestAskNotification`, {
        product_id: pair.productID,
        seller_id: UID,
        condition,
        size,
        listing_id: listingID,
        price
      });

      //update sizes_lowest_ask
      let data = pair.sizes_lowest_ask
      data[size] = price
      //console.log(data)

      //update sizes_lowest_ask and sizes_available
      batch.update(prodRef, {
        sizes_lowest_ask: data,
        sizes_available: firebase.firestore.FieldValue.arrayUnion(size),
        trending_score: firebase.firestore.FieldValue.increment(1)
      })
    }

    return batch.commit()
      .then(() => {
        //console.log('New Listing Added');
        //console.log(`size_lowest: ${pair.sizes_lowest_ask[size]} and price: ${price}`)

        if (!(sizeLowestAskNotif == undefined || sizeLowestAskNotif == null)) sizeLowestAskNotif.subscribe()

        this.http.post(`${environment.cloud.url}askNotification`, this.ask_data).subscribe() //send ask email

        return true;
      })
      .catch((err) => {
        console.error(err)
        return false
      })
  }

  public async deleteAsk(ask: Ask): Promise<boolean> {
    const batch = this.afs.firestore.batch();
    const userAskRef = this.afs.firestore.collection('users').doc(`${ask.sellerID}`).collection('listings').doc(`${ask.listingID}`); //ask in user doc ref
    const prodAskRef = this.afs.firestore.collection('products').doc(`${ask.productID}`).collection('listings').doc(`${ask.listingID}`); //ask in prod doc ref
    const userRef = this.afs.firestore.collection('users').doc(`${ask.sellerID}`); //user doc ref
    const askRef = this.afs.firestore.collection(`asks`).doc(`${ask.listingID}`); //ask in asks collection ref
    let sendLowestAskNotification: Observable<any>
    let product: Product;

    this.ask_data = ask

    batch.delete(userAskRef); //remove ask in user doc
    batch.delete(prodAskRef); //remove ask in prod doc
    batch.delete(askRef); //remove ask in asks collection

    //udpate ask number in user doc
    batch.update(userRef, {
      listed: firebase.firestore.FieldValue.increment(-1)
    });

    const prodRef = this.afs.firestore.collection(`products`).doc(`${ask.productID}`); //prod ref in prod document
    let prices: Ask[] = [] //lowest prices
    let size_prices: Ask[] = [] //size lowest prices

    //get two lowest prices
    await prodRef.collection(`listings`).orderBy(`price`, `asc`).limit(2).get().then(snap => {
      snap.forEach(data => {
        prices.push(data.data() as Ask);
      })
    })

    //get two lowest prices in specific size
    await prodRef.collection(`listings`).where('size', '==', `${ask.size}`).where('condition', '==', `${ask.condition}`).orderBy(`price`, `asc`).limit(2).get().then(snap => {
      snap.forEach(ele => {
        size_prices.push(ele.data() as Ask)
      })
    })

    //get product document
    await prodRef.get().then(snap => {
      if (snap.exists) {
        product = snap.data() as Product
      }
    })

    //console.log(`length: ${prices.length}; price1: ${prices[0].price}; price2: ${prices[1].price}`);
    //console.log(prices);

    //udpate new lowest price
    if (prices.length === 1) {
      batch.update(prodRef, {
        lowest_price: firebase.firestore.FieldValue.delete()
      });
    } else if (ask.price === prices[0].price && prices[0].price != prices[1].price) {
      batch.update(prodRef, {
        lowest_price: prices[1].price
      })
    }

    //lowest ask email notification and product document updates
    if (ask.listingID === size_prices[0].listingID && !(size_prices[1] == undefined || size_prices[1] == null)) {
      sendLowestAskNotification = this.http.put(`${environment.cloud.url}lowestAskNotification`, {
        product_id: size_prices[1].productID,
        seller_id: size_prices[1].sellerID,
        condition: size_prices[1].condition,
        size: size_prices[1].size,
        listing_id: size_prices[1].listingID,
        price: size_prices[1].price
      })

      const data = product.sizes_lowest_ask
      data[ask.size] = size_prices[1].price
      batch.update(prodRef, {
        sizes_lowest_ask: data
      })
    } else if (ask.listingID === size_prices[0].listingID && (size_prices[1] == undefined || size_prices[1] == null)) {
      const data = product.sizes_lowest_ask
      data[ask.size] = 0
      batch.update(prodRef, {
        sizes_lowest_ask: data,
        sizes_available: firebase.firestore.FieldValue.arrayRemove(ask.size)
      })
    }

    //commit the updates
    return batch.commit()
      .then(() => {
        //console.log('listing deleted');

        if (!(sendLowestAskNotification == undefined || sendLowestAskNotification == null)) sendLowestAskNotification.subscribe() //send lowest ask email

        this.http.put(`${environment.cloud.url}askNotification`, this.ask_data).subscribe() //send email notification when we ask deleted

        return true;
      })
      .catch((err) => {
        console.error(err)
        return false
      })
  }

  public async updateAsk(ask: Ask, price: number, expiration_date: number): Promise<boolean> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid
    })

    const batch = this.afs.firestore.batch()
    const last_updated = Date.now()
    const userAskRef = this.afs.firestore.collection('users').doc(`${UID}`).collection('listings').doc(`${ask.listingID}`) //ask in user doc ref
    const prodAskRef = this.afs.firestore.collection('products').doc(`${ask.productID}`).collection('listings').doc(`${ask.listingID}`) //ask in prod doc ref
    const askRef = this.afs.firestore.collection(`asks`).doc(`${ask.listingID}`) //ask in asks collection ref
    const prodRef = this.afs.firestore.collection(`products`).doc(`${ask.productID}`) //prod ref in prod document
    let prices: Ask[] = [] //lowest prices
    let size_prices: Ask[] = [] //size lowest prices
    let product: Product;

    //get the two lowest prices
    await prodRef.collection(`listings`).orderBy(`price`, `asc`).limit(2).get().then(snap => {
      snap.forEach(ele => {
        prices.push(ele.data() as Ask)
      });
    });

    //get the two lowest prices in specific size
    await prodRef.collection(`listings`).where('size', '==', `${ask.size}`).where('condition', '==', `${ask.condition}`).orderBy(`price`, `asc`).limit(2).get().then(snap => {
      snap.forEach(ele => {
        size_prices.push(ele.data() as Ask)
      })
    })

    //get prod info and compare current ask price w lowest ask. update if necessary.
    await prodRef.get().then(snap => {
      product = snap.data() as Product

      if ((prices[1] == undefined || prices[1] == null) || price <= product.lowest_price) {
        batch.update(prodRef, { lowest_price: price })
      } else {
        if (price < prices[1].price) batch.update(prodRef, { lowest_price: price })
        else batch.update(prodRef, { lowest_price: prices[1].price })
      }
    })

    // update ask in asks collection
    batch.update(askRef, {
      condition: ask.condition,
      price: price,
      size: ask.size,
      last_updated,
      expiration_date
    })

    // update ask in user doc
    batch.update(userAskRef, {
      condition: ask.condition,
      price: price,
      size: ask.size,
      last_updated,
      expiration_date
    })

    // update ask in prod doc
    batch.update(prodAskRef, {
      condition: ask.condition,
      price: price,
      size: ask.size,
      last_updated,
      expiration_date
    })

    batch.update(prodRef, {
      trending_score: firebase.firestore.FieldValue.increment(1)
    })

    // commit the updates
    return batch.commit()
      .then(() => {
        //console.log('Listing updated');
        this.sendLowestAskNotification(price, ask.condition, ask.size, UID, ask.productID, ask.listingID, size_prices, product) //send new lowest ask notification if necessary

        this.ask_data = {
          assetURL: ask.assetURL,
          condition: ask.condition,
          listingID: ask.listingID,
          model: ask.model,
          productID: ask.productID,
          price: ask.price,
          sellerID: ask.sellerID,
          size: ask.size,
          created_at: ask.created_at
        }

        this.http.patch(`${environment.cloud.url}askNotification`, this.ask_data).subscribe()

        return true
      })
      .catch((err) => {
        //console.error(err);
        return false
      });
  }

  private sendLowestAskNotification(price: number, condition: string, size: string, UID: string, product_id: string, listing_id: string, size_prices: Ask[], product: Product) {
    if (price < size_prices[0].price) { // send email notif when new ask is lower than lowest ask
      this.http.put(`${environment.cloud.url}lowestAskNotification`, {
        product_id: product_id,
        seller_id: UID,
        condition,
        size,
        listing_id: listing_id,
        price
      }).subscribe()

      const data = product.sizes_lowest_ask
      data[size] = price
      this.afs.collection('products').doc(product_id).update({
        sizes_lowest_ask: data
      })
    } else if (!(size_prices[1] == undefined || size_prices[1] == null) && listing_id === size_prices[0].listingID && price > size_prices[0].price) { // new ask was lowest ask and is now higher
      if (price >= size_prices[1].price) { // send email notif when new ask is higher than second lowest ask
        this.http.put(`${environment.cloud.url}lowestAskNotification`, {
          product_id: product_id,
          seller_id: size_prices[1].sellerID,
          condition,
          size,
          listing_id: size_prices[1].listingID,
          price: size_prices[1].price
        }).subscribe()

        const data = product.sizes_lowest_ask
        data[size] = size_prices[1].price
        this.afs.collection('products').doc(product_id).update({
          sizes_lowest_ask: data
        })
      } else if (price < size_prices[1].price) { // send email notif when new ask is lower than second lowest ask
        this.http.put(`${environment.cloud.url}lowestAskNotification`, {
          product_id: product_id,
          seller_id: UID,
          condition,
          size,
          listing_id: listing_id,
          price
        }).subscribe()

        const data = product.sizes_lowest_ask
        data[size] = price
        this.afs.collection('products').doc(product_id).update({
          sizes_lowest_ask: data
        })
      }
    } else if ((size_prices[1] == undefined || size_prices[1] == null)) { // send email notif when new ask is the only ask for this size
      this.http.put(`${environment.cloud.url}lowestAskNotification`, {
        product_id: product_id,
        seller_id: UID,
        condition,
        size,
        listing_id: listing_id,
        price
      }).subscribe()

      const data = product.sizes_lowest_ask
      data[size] = price
      this.afs.collection('products').doc(product_id).update({
        sizes_lowest_ask: data
      })
    }
  }

  public extendAsk(ask: Ask): Promise<Ask | boolean> {
    const data: Ask = ask
    const new_date = Date.now()
    const batch = this.afs.firestore.batch()

    data.expiration_date = new_date + (86400000 * ((data.expiration_date - data.last_updated) / 86400000 - 1))
    data.last_updated = new_date

    batch.set(this.afs.firestore.collection('products').doc(data.productID).collection('listings').doc(data.listingID), data)
    batch.update(this.afs.firestore.collection('asks').doc(data.listingID), data)
    batch.update(this.afs.firestore.collection('users').doc(data.sellerID).collection('listings').doc(data.listingID), data)

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
