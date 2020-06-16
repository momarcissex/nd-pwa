import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { NxtdropCC } from '../models/nxtdrop_cc';

@Injectable({
  providedIn: 'root'
})
export class NxtdropCcService {

  constructor(
    private afs: AngularFirestore
  ) { }

  getPromoCode(cardID: string) {
    return this.afs.collection('nxtcards').doc(`${cardID}`).valueChanges() as Observable<NxtdropCC>;
  }
}
