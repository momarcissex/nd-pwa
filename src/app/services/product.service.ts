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

  getProductInfo(productID) {
    return this.afs.collection('products').doc(`${productID}`).valueChanges() as Observable<Product>
  }

  getBuy(productID) {
    return this.afs.collection('products').doc(`${productID}`).collection('listings', ref => ref.orderBy(`size`, `asc`)).valueChanges();
  }

  getOffers(productID) {
    return this.afs.collection('products').doc(`${productID}`).collection('offers', ref => ref.orderBy(`size`, `asc`)).valueChanges();
  }
}
