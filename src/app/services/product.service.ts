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
    return this.afs.collection('products').doc(`${productID}`).valueChanges() as Observable<Product>
  }

  getBuy(productID) {
    return this.afs.collection('products').doc(`${productID}`).collection('listings', ref => ref.orderBy(`size`, `asc`)).valueChanges();
  }

  getOffers(productID) {
    return this.afs.collection('products').doc(`${productID}`).collection('offers', ref => ref.orderBy(`size`, `asc`)).valueChanges();
  }

  countView(productID: string) {
    return this.afs.firestore.collection('products').doc(`${productID}`).update({
      trending_score: firebase.firestore.FieldValue.increment(0.14)
    });
  }

  shareCount(productID: string) {
    return this.afs.firestore.collection('products').doc(productID).update({
      trending_score: firebase.firestore.FieldValue.increment(1)
    })
  }
}
