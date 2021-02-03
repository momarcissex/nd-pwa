import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  constructor(
    private crypto: Crypto,
    private afs: AngularFirestore
  ) { }

  /**
   * Logs an activity to the database
   */
  logActivity(product_id: string, event: string) {
    console.log(this.crypto.getRandomValues(new Uint8Array(6)).toString())
  }
}
