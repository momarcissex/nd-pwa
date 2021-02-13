import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

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
    if (startAfter == null || startAfter == undefined) {
      return this.afs.collection(`transactions`, ref => ref.where(`buyer_id`, `==`, `${uid}`).orderBy('purchase_date', 'desc').limit(15)).valueChanges();
    } else {
      return this.afs.collection(`transactions`, ref => ref.where(`buyer_id`, `==`, `${uid}`).orderBy('purchase_date', 'desc').startAfter(startAfter)).valueChanges();
    }
  }

  sales(uid: string, startAfter?: number) {
    if (startAfter == null || startAfter == undefined) {
      return this.afs.collection(`transactions`, ref => ref.where(`seller_id`, `==`, `${uid}`).orderBy('purchase_date', 'desc').limit(15)).valueChanges();
    } else {
      return this.afs.collection(`transactions`, ref => ref.where(`seller_id`, `==`, `${uid}`).orderBy('purchase_date', 'desc').startAfter(startAfter)).valueChanges();
    }
  }
}
