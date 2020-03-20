import {
  Injectable,
  NgZone,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument
} from '@angular/fire/firestore';

import { User } from '../models/user';
import { first } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import { EmailService } from './email.service';
import { isUndefined, isNullOrUndefined } from 'util';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

declare const gtag: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user;
  userStatus: boolean;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private emailService: EmailService,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) { }

  async signOut(redirect: boolean) {
    await this.afAuth.auth.signOut()
      .then(() => {
        console.log('Signed Out');
        if (redirect) {
          return this.ngZone.run(() => {
            return this.router.navigate(['/bye']);
          });
        }
      })
      .catch((error) => {
        console.error('Sign out error', error);
      });
  }

  async googleSignIn() {
    const provider = new auth.GoogleAuthProvider();
    this.oAuthLogin(provider);
  }

  async facebookSignIn() {
    const provider = new auth.FacebookAuthProvider();
    this.oAuthLogin(provider);
  }

  async emailSignUp(email: string, password: string, firstName: string, lastName: string, username: string, inviteCode?: string) {
    if (email || password || firstName || lastName || username) {
      return this.afAuth.auth.createUserWithEmailAndPassword(email, password)
        .then(user => {
          const userData: User = {
            firstName,
            lastName,
            username,
            email: user.user.email,
            uid: user.user.uid,
            listed: 0,
            sold: 0,
            ordered: 0,
            offers: 0,
            isActive: false
          };

          if (!isUndefined(inviteCode)) {
            userData.freeShipping = true;
            this.afs.collection(`users`).doc(`${inviteCode}`).set({
              shippingPromo: {
                sent: true,
                accepted: true
              },
              freeShipping: true
            }, { merge: true }).catch(err => {
              console.error(err);
              this.afAuth.auth.currentUser.delete();
              return false;
            });
          }

          if (isPlatformBrowser(this._platformId)) {
            gtag('event', 'sign_up', {
              'event_category': 'engagement',
              'event_label': 'Email_SignUp'
            });
          }

          return this.createUserData(userData, user);
        });
    } else {
      return false;
    }
  }

  async emailLogin(email: string, password: string) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        this.isConnected().then(res => {
          if (!isNullOrUndefined(res)) {
            this.updateLastActivity(res.uid);
          }
        })

        return true;
      })
      .catch(error => {
        console.error('Error Login: Email or Password Invalid.');
        return false;
      });
  }

  private oAuthLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then((credential) => {

        if (isPlatformBrowser(this._platformId)) {
          gtag('event', 'sign_up', {
            'event_category': 'engagement',
            'event_label': 'Social_Media_SignUp'
          });
        }

        if (this.handleAuthToken(credential.user)) {
          console.log('does exist');
          // console.log(this.handleAuthToken(credential.user));
        } else {
          console.log('does not exist');
        }
      })
      .catch(error => {
        console.error('Error: ', error);
      });
  }

  private handleAuthToken(user) {
    return this.checkEmail(user.email).get().subscribe((snapshot) => {
      const redirect = this.route.snapshot.queryParams.redirectTo;

      this.isConnected().then(res => {
        if (!isNullOrUndefined(res)) {
          this.updateLastActivity(res.uid);
        }
      })

      if (snapshot.empty) {
        if (!isUndefined(redirect)) {
          return this.ngZone.run(() => {
            return this.router.navigate(['/additional-information'], {
              queryParams: { redirectTo: redirect }
            });
          });
        } else {
          return this.ngZone.run(() => {
            return this.router.navigate(['/additional-information']);
          });
        }
      } else {
        if (!isUndefined(redirect)) {
          return this.ngZone.run(() => {
            return this.router.navigateByUrl(`${redirect}`);
          });
        } else {
          return this.ngZone.run(() => {
            return this.router.navigate(['/home']);
          });
        }
      }
    });
  }

  private createUserData(user: User, userCred: auth.UserCredential) {
    const userRef = this.afs.firestore.doc(`users/${user.uid}`);
    const userVerificationRef = this.afs.firestore.doc(`userVerification/${user.uid}`);
    const redirect = this.route.snapshot.queryParams.redirectTo;

    const batch = this.afs.firestore.batch();

    batch.set(userRef, user, { merge: true });
    batch.set(userVerificationRef, {
      uid: user.uid,
      username: user.username,
      email: user.email
    }, { merge: true });

    return batch.commit()
      .then(() => {
        console.log('User information updated');
        this.emailService.activateAccount();

        if (!isUndefined(redirect)) {
          return this.ngZone.run(() => {
            return this.router.navigateByUrl(`${redirect}`);
          });
        } else {
          return this.ngZone.run(() => {
            return this.router.navigate(['/home']);
          });
        }
      })
      .catch((error) => {
        console.error('Error: ', error);
        userCred.user.delete().catch(err => {
          console.error(err);
        });
        return false;
      });
  }

  public isConnected(): Promise<firebase.User> {
    return this.afAuth.authState.pipe(first()).toPromise();
  }

  public async checkStatus() {
    const user = await this.isConnected();

    if (user) {
      return true;
    } else {
      return false;
    }
  }

  public addInformationUser(firstName: string, lastName: string, username: string, password: string) {
    if (!isNullOrUndefined(this.afAuth.auth.currentUser)) {
      const credential = auth.EmailAuthProvider.credential(this.afAuth.auth.currentUser.email, password);

      return this.afAuth.auth.currentUser.linkWithCredential(credential)
        .then((userCredential) => {
          const userData: User = {
            firstName,
            lastName,
            username,
            email: userCredential.user.email,
            uid: userCredential.user.uid,
            listed: 0,
            sold: 0,
            ordered: 0,
            offers: 0,
            isActive: true
          };

          return this.createUserData(userData, userCredential);
        })
        .catch((error) => {
          console.error('Account linking error', error);
        });
    } else {
      return Promise.resolve(false);
    }
  }

  checkUsername(username: string) {
    //console.log('checkUsername() called');
    return this.afs.collection('userVerification', ref => ref.where('username', '==', username));
  }

  checkEmail(email: string) {
    //console.log('checkEmail() called');
    return this.afs.collection('userVerification', ref => ref.where('email', '==', email));
  }

  getUserData(uid: string) {
    return this.afs.collection(`users`).doc(`${uid}`).valueChanges() as Observable<User>;
  }

  updateLastActivity(userID: string) {
    this.afs.collection('users').doc(`${userID}`).set({
      lastActivity: Date.now()
    }, { merge: true });
  }
}
