import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { isNullOrUndefined } from 'util';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private afs: AngularFirestore
  ) { }

  userData(uid: string) {
    return this.afs.collection(`users`).doc(`${uid}`).valueChanges();
  }

  purchases(uid: string, startAfter?: number) {
    if (isNullOrUndefined(startAfter)) {
      return this.afs.collection(`transactions`, ref => ref.where(`buyerID`, `==`, `${uid}`).orderBy('purchaseDate', 'desc').limit(15)).valueChanges();
    } else {
      return this.afs.collection(`transactions`, ref => ref.where(`buyerID`, `==`, `${uid}`).orderBy('purchaseDate', 'desc').startAfter(startAfter)).valueChanges();
    }
  }

  sales(uid: string, startAfter?: number) {
    if (isNullOrUndefined(startAfter)) {
      return this.afs.collection(`transactions`, ref => ref.where(`sellerID`, `==`, `${uid}`).orderBy('purchaseDate', 'desc').limit(15)).valueChanges();
    } else {
      return this.afs.collection(`transactions`, ref => ref.where(`sellerID`, `==`, `${uid}`).orderBy('purchaseDate', 'desc').startAfter(startAfter)).valueChanges();
    }
  }
}
