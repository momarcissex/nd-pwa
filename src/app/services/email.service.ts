import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private http: HttpClient
  ) { }

  passwordChange() {
    const user = this.afAuth.auth.currentUser;
    const endpoint = `${environment.cloud.url}changedPassword`;

    this.afs.collection(`users`).doc(`${user.uid}`).get().subscribe(res => {
      const email = res.data().email;

      const data = {
        toEmail: email,
        toName: res.data().username
      };

      this.http.post(endpoint, data).subscribe();
    })
  }

  sendResetLink(email: string) {
    return this.afs.collection(`users`).ref.where(`email`, `==`, `${email}`).limit(1).get().then(res => {
      if (!res.empty) {
        const endpoint = `${environment.cloud.url}resetPassword`;
        const data = {
          toEmail: res.docs[0].data().email,
          toUsername: res.docs[0].data().username,
          toUid: res.docs[0].data().uid
        }

        return this.http.post(endpoint, data);
      }
    });
  }

  resetPassword(code: string, newPass: string, uid: string, email: string) {
    const endpoint = `${environment.cloud.url}newPassword`;
    const data = {
      code,
      newPass,
      uid,
      email
    };

    return this.http.put(endpoint, data);
  }

  activateAccount() {
    const user = this.afAuth.auth.currentUser;
    const endpoint = `${environment.cloud.url}accountCreated`;

    this.afs.collection(`users`).doc(`${user.uid}`).get().subscribe(res => {
      const email = res.data().email;

      const data = {
        toEmail: email,
        toFirstName: res.data().firstName,
        toLastName: res.data().lastName,
        toUid: res.data().uid
      };

      this.http.post(endpoint, data).subscribe();
    })
  }
}
