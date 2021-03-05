import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction';

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
      return this.afs.collection(`transactions`).ref.where(`buyer_id`, `==`, `${uid}`).orderBy('purchase_date', 'desc').limit(15).get()
    } else {
      return this.afs.collection(`transactions`).ref.where(`buyer_id`, `==`, `${uid}`).orderBy('purchase_date', 'desc').startAfter(startAfter).get()
    }
  }

  sales(uid: string, startAfter?: number) {
    if (startAfter == null || startAfter == undefined) {
      return this.afs.collection(`transactions`).ref.where(`seller_id`, `==`, `${uid}`).orderBy('purchase_date', 'desc').limit(15).get();
    } else {
      return this.afs.collection(`transactions`).ref.where(`seller_id`, `==`, `${uid}`).orderBy('purchase_date', 'desc').startAfter(startAfter).get();
    }
  }
}
