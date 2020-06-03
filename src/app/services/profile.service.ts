import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { User } from '../models/user';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/app';
import { isUndefined, isNullOrUndefined } from 'util';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Ask } from '../models/ask';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService,
    private http: HttpClient
  ) { }

  public async getUserData(): Promise<Observable<User>> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${UID}`);
    return userRef.valueChanges();
  }

  public async getUserListings(startAfter?): Promise<Observable<any>> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    let userRef: AngularFirestoreCollection<any>;

    if (isUndefined(startAfter)) {
      // tslint:disable-next-line: max-line-length
      userRef = this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.orderBy('timestamp', 'desc').limit(60));
    } else {
      // tslint:disable-next-line: max-line-length
      userRef = this.afs.collection(`users`).doc(`${UID}`).collection(`listings`, ref => ref.orderBy('timestamp', 'desc').startAfter(startAfter).limit(60));
    }

    return userRef.valueChanges();
  }

  public async getUserOffers(startAfter?): Promise<Observable<any>> {
    let UID: string;
    await this.auth.isConnected().then(data => {
      UID = data.uid;
    });

    let userRef: AngularFirestoreCollection<any>;

    if (isUndefined(startAfter)) {
      // tslint:disable-next-line: max-line-length
      userRef = this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.orderBy('timestamp', 'desc').limit(60));
    } else {
      // tslint:disable-next-line: max-line-length
      userRef = this.afs.collection(`users`).doc(`${UID}`).collection(`offers`, ref => ref.orderBy('timestamp', 'desc').startAfter(startAfter).limit(60));
    }

    return userRef.valueChanges();
  }
}
