import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private afs: AngularFirestore
  ) { }

  getProductInfo(product_id) {
    return this.afs.collection('products').doc(`${product_id}`).valueChanges() as Observable<Product>
  }

  getBuy(product_id) {
    return this.afs.collection('products').doc(`${product_id}`).collection('listings', ref => ref.orderBy(`size`, `asc`)).valueChanges();
  }

  getOffers(product_id) {
    return this.afs.collection('products').doc(`${product_id}`).collection('offers', ref => ref.orderBy(`size`, `asc`)).valueChanges();
  }

  getUserAsks(product_id: string, user_id: string) {
    return this.afs.collection('products').doc(`${product_id}`).collection('listings', ref => ref.where('seller_id', '==', user_id).orderBy('expiration_date', 'desc')).get();
  }

  getUserBids(product_id: string, user_id: string) {
    return this.afs.collection('products').doc(`${product_id}`).collection('offers', ref => ref.where('buyer_id', '==', user_id).orderBy('expiration_date', 'desc')).get();
  }
}
