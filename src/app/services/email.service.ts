import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SlackService } from './slack.service';


@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private http: HttpClient,
    private slack: SlackService
  ) { }

  passwordChange() {
    this.afAuth.currentUser.then(user => {
      const endpoint = `${environment.cloud.url}changedPassword`;

      this.afs.collection(`users`).doc(`${user.uid}`).get().subscribe(res => {
        const email = res.data().email;

        const data = {
          toEmail: email,
          toName: res.data().username
        };

        this.http.post(endpoint, data).subscribe();
      })
    }).catch(err => {
      console.error('Getting current user error', err)
      this.slack.sendAlert('bugreport', `this.afAuth.currentUser.then error: ${err}`)
    })
  }

  sendResetLink(email: string) {
    return this.afs.collection(`userVerification`).ref.where(`email`, `==`, `${email}`).limit(1).get().then(res => {
      if (!res.empty) {
        const endpoint = `${environment.cloud.url}resetPassword`;
        const data = {
          toEmail: res.docs[0].data().email,
          toUsername: res.docs[0].data().username,
          toUid: res.docs[0].data().uid
        }

        return this.http.post(endpoint, data);
      } else {
        return false
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
    this.afAuth.currentUser.then(user => {
      const endpoint = `${environment.cloud.url}accountCreated`;

      this.afs.collection(`users`).doc(`${user.uid}`).get().subscribe(res => {
        const email = res.data().email;

        const data = {
          email: email,
          first_name: res.data().first_name,
          last_name: res.data().last_name,
          uid: res.data().uid,
          last_login: res.data().last_login,
          creation_date: res.data().creation_date
        };

        this.http.post(endpoint, data).subscribe();
      })
    }).catch(err => {
      console.error('Getting current user error', err)
      this.slack.sendAlert('bugreport', `this.afAuth.currentUser.then error: ${err}`)
    })
  }
}
