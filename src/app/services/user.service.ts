import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentData, QuerySnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { auth } from 'firebase/app';
import { AuthService } from './auth.service';
import { Ask } from '../models/ask';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private afs: AngularFirestore,
    private http: HttpClient,
    private auth: AuthService
  ) { }

  getUserInfo(uid: string): Observable<User> {
    return this.afs.collection('users').doc(`${uid}`).valueChanges() as Observable<User>
  }

  updateUserProfile(uid: string, first_name: string, last_name: string, username: string, dob: string, email: string) {
    const batch = this.afs.firestore.batch();

    const userRef = this.afs.firestore.collection(`users`).doc(`${uid}`);
    const userVerificationRef = this.afs.firestore.collection('userVerification').doc(`${uid}`);

    const date = new Date(dob).getTime() / 1000;
    // console.log(date);

    batch.update(userRef, {
      first_name: first_name,
      last_name: last_name,
      username: username,
      dob: date
    });

    batch.update(userVerificationRef, {
      username
    })

    return batch.commit()
      .then(() => {
        this.http.patch(`${environment.cloud.url}updateContact`, {
          first_name,
          last_name,
          username,
          dob: date,
          email,
          mode: 'name_change'
        }).subscribe()
        return true;
      })
      .catch((err) => {
        console.error(err);
        return false;
      });
  }

  updateEmail(old_email: string, new_email: string, pwd: string, current_user: firebase.User, user_data: User) {
    const credentials = auth.EmailAuthProvider.credential(old_email, pwd)
    const batch = this.afs.firestore.batch()
    const userRef = this.afs.firestore.collection('users').doc(current_user.uid)
    const userVerifRef = this.afs.firestore.collection('userVerification').doc(current_user.uid)

    batch.update(userRef, {
      email: new_email
    })

    batch.update(userVerifRef, {
      email: new_email
    })

    return current_user.reauthenticateWithCredential(credentials).then(() => {
      return current_user.updateEmail(new_email).then(() => {
        return batch.commit()
          .then(() => {
            this.http.patch(`${environment.cloud.url}updateContact`, {
              mode: 'email_change',
              old_email,
              new_email,
              first_name: user_data.first_name,
              last_name: user_data.first_name,
              creation_date: user_data.creation_date,
              last_login: user_data.last_login
            }).subscribe()
            return true
          })
          .catch(err => {
            console.error(err)
            return false
          })
      }).catch(err => {
        console.error(err)
        return false
      })
    }).catch(err => {
      console.error(err)
      return false
    })
  }

  updateShippingInfo(uid: string, first_name: string, last_name: string, street: string, line: string, city: string, province: string, postal_code: string, country: string, isBuying: boolean): Promise<boolean> {
    const userRef = this.afs.collection(`users`).doc(`${uid}`);
    postal_code = postal_code.toUpperCase();
    const data: User['shipping_address']['buying'] = {
      first_name,
      last_name,
      street,
      line2: line,
      city,
      province,
      postal_code,
      country
    }

    if (isBuying) {
      return userRef.set({
        shipping_address: {
          buying: data
        }
      }, { merge: true })
        .then(() => {
          return true;
        })
        .catch((err) => {
          console.log(err)
          return false;
        });
    } else {
      return userRef.set({
        shipping_address: {
          selling: data
        }
      }, { merge: true })
        .then(() => {
          return true;
        })
        .catch((err) => {
          console.log(err)
          return false;
        });
    }
  }

  updateLastCartItem(uid: string, product_id: string, size: string) {
    this.afs.collection(`users`).doc(uid).set({
      last_item_in_cart: {
        product_id,
        size,
        timestamp: Date.now()
      }
    }, { merge: true })
  }

  public async getUserData(): Promise<Observable<User>> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    return this.afs.doc(`users/${UID}`).valueChanges() as Observable<User>;
  }

  public async getUserListings(filter: 'All' | 'Active' | 'Expired' | 'Oldest' | 'Recent', startAfter?: Ask): Promise<Observable<QuerySnapshot<DocumentData>>> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    //console.log(UID)

    if (filter === 'All') {
      if (startAfter == undefined) return this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.orderBy('created_at', 'desc').limit(60)).get()
      else return this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.orderBy('created_at', 'desc').startAfter(startAfter.created_at).limit(60)).get()
    } else if (filter === 'Active') {
      if (startAfter == undefined) return this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.where('expiration_date', '>=', Date.now()).orderBy('expiration_date', 'asc').limit(60)).get()
      else return this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.where('expiration_date', '>=', Date.now()).orderBy('expiration_date', 'asc').startAfter(startAfter.expiration_date).limit(60)).get()
    } else if (filter === 'Expired') {
      console.log('expired')
      if (startAfter == undefined) return this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.where('expiration_date', '<', Date.now()).orderBy('expiration_date', 'asc').limit(60)).get()
      else return this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.where('expiration_date', '<', Date.now()).orderBy('expiration_date', 'asc').startAfter(startAfter.expiration_date).limit(60)).get()
    } else if (filter === 'Oldest') {
      if (startAfter == undefined) return this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.orderBy('last_updated', 'asc').limit(60)).get()
      else return this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.orderBy('last_updated', 'asc').startAfter(startAfter.last_updated).limit(60)).get()
    } else if (filter === 'Recent') {
      if (startAfter == undefined) return this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.orderBy('last_updated', 'desc').limit(60)).get()
      else return this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.orderBy('last_updated', 'desc').startAfter(startAfter.last_updated).limit(60)).get()
    }
  }

  public async getUserOffers(filter: 'All' | 'Active' | 'Expired' | 'Oldest' | 'Recent', startAfter?: number): Promise<Observable<QuerySnapshot<DocumentData>>> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    if (filter === 'All') {
      if (startAfter == undefined) return this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.orderBy('created_at', 'desc').limit(60)).get()
      else return this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.orderBy('created_at', 'desc').startAfter(startAfter).limit(60)).get()
    } else if (filter === 'Active') {
      if (startAfter == undefined) return this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.where('expiration_date', '<', Date.now()).orderBy('created_at', 'desc').limit(60)).get()
      else return this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.where('expiration_date', '<', Date.now()).orderBy('created_at', 'desc').startAfter(startAfter).limit(60)).get()
    } else if (filter === 'Expired') {
      if (startAfter == undefined) return this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.where('expiration_date', '>=', Date.now()).orderBy('created_at', 'desc').limit(60)).get()
      else return this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.where('expiration_date', '>=', Date.now()).orderBy('created_at', 'desc').startAfter(startAfter).limit(60)).get()
    } else if (filter === 'Oldest') {
      if (startAfter == undefined) return this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.orderBy('last_updated', 'desc').limit(60)).get()
      else return this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.orderBy('last_updated', 'desc').startAfter(startAfter).limit(60)).get()
    } else if (filter === 'Recent') {
      if (startAfter == undefined) return this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.orderBy('last_updated', 'asc').limit(60)).get()
      else return this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.orderBy('last_updated', 'asc').startAfter(startAfter).limit(60)).get()
    }
  }
}
