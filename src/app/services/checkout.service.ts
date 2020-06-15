import { Injectable } from '@angular/core';
// import { CartService } from './cart.service';
import { AuthService } from './auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import { Transaction } from '../models/transaction';
import { SlackService } from './slack.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { isNullOrUndefined } from 'util';
import { Bid } from '../models/bid';
import { Ask } from '../models/ask';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  constructor(
    // private cartService: CartService,
    private auth: AuthService,
    private afs: AngularFirestore,
    private slack: SlackService,
    private http: HttpClient
  ) { }

  /*getCartItems() {
    return this.cartService.getCartItems();
  }*/

  getPromoCode(cardID: string) {
    return this.afs.collection('nxtcards').doc(`${cardID}`).ref.get();
  }
}
