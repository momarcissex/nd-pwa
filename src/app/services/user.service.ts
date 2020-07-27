import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { auth } from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private afs: AngularFirestore,
    private http: HttpClient
  ) { }

  getUserInfo(userId: string): Observable<User> {
    return this.afs.collection('users').doc(`${userId}`).valueChanges() as Observable<User>
  }

  updateUserProfile(userId: string, firstName: string, lastName: string, username: string, dob: string, email: string) {
    const batch = this.afs.firestore.batch();

    const userRef = this.afs.firestore.collection(`users`).doc(`${userId}`);
    const userVerificationRef = this.afs.firestore.collection('userVerification').doc(`${userId}`);

    const date = new Date(dob).getTime() / 1000;
    // console.log(date);

    batch.update(userRef, {
      firstName: firstName,
      lastName: lastName,
      username: username,
      dob: date
    });

    batch.update(userVerificationRef, {
      username
    })

    return batch.commit()
      .then(() => {
        this.http.patch(`${environment.cloud.url}updateContact`, {
          firstName,
          lastName,
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
              first_name: user_data.firstName,
              last_name: user_data.lastName,
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

  updateShippingInfo(userId: string, firstName: string, lastName: string, street: string, line: string, city: string, province: string, postalCode: string, country: string, isBuying: boolean): Promise<boolean> {
    const userRef = this.afs.collection(`users`).doc(`${userId}`);
    postalCode = postalCode.toUpperCase();
    const data = {
      firstName,
      lastName,
      street,
      line2: line,
      city,
      province,
      postalCode,
      country
    }

    if (isBuying) {
      return userRef.set({
        shippingAddress: {
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
        shippingAddress: {
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

  updateLastCartItem(userID: string, product_id: string, size: string) {
    this.afs.collection(`users`).doc(userID).set({
      last_item_in_cart: {
        product_id,
        size,
        timestamp: Date.now()
      }
    }, { merge: true })
  }
}
