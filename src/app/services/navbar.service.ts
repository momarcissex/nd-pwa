import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { isUndefined, isNull } from 'util';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {

  constructor(
    private auth: AuthService,
    private afs: AngularFirestore
  ) { }

  async getCartItems() {
    let UID;
    await this.auth.isConnected().then(data => {
      if (!isNull(data)) {
        UID = data.uid;
      }
    });

    if (!isUndefined(UID)) {
      return await this.afs.collection(`users`).doc(`${UID}`).valueChanges();
    } else {
      return of(null);
    }
  }
}
