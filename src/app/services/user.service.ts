import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService
  ) { }

  getUserInfo(userId: string): Observable<User> {
    return this.afs.collection('users').doc(`${userId}`).valueChanges() as Observable<User>
  }

  updateUserProfile(userId: string, firstName: string, lastName: string, username: string, dob: string) {
    const batch = this.afs.firestore.batch();

    const userRef = this.afs.firestore.collection(`users`).doc(`${userId}`);
    const userVerificationRef = this.afs.firestore.collection('userVerification').doc(`${userId}`);

    const date = new Date(dob).getTime() / 1000;
    // console.log(date);

    batch.update(userRef, {
      'firstName': firstName,
      'lastName': lastName,
      'username': username,
      'dob': date
    });

    batch.update(userVerificationRef, {
      username
    })

    return batch.commit()
      .then(() => {
        return true;
      }).catch((err) => {
        console.error(err);
        return false;
      });
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
