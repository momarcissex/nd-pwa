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
} from '@angular/fire/firestore';

import { User } from '../models/user';
import { first } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import { EmailService } from './email.service';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { IpService } from './ip.service';
import { SlackService } from './slack.service';
import { Globals } from '../globals';

declare const gtag: any;
declare const fbq: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user;

  isEmailSignUp: boolean = false

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private emailService: EmailService,
    private http: HttpClient,
    private ipService: IpService,
    private slack: SlackService,
    public globals: Globals,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) { }

  async signOut(redirect: boolean) {
    await this.afAuth.signOut()
      .then(() => {
        this.globals.userSignedOut()
        window.Intercom('shutdown')
        window.Intercom("boot", {
          app_id: "w1p7ooc8"
        });

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

    return this.afAuth.signInWithPopup(provider)
      .then(credential => {
        return this.checkEmail(credential.user.email).get().subscribe((snapshot) => {
          const redirect = this.route.snapshot.queryParams.redirectTo;

          if (snapshot.empty) {
            if (redirect != undefined) {
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
            this.ipService.getIPAddress().subscribe((data: any) => {
              this.updateLastActivity(credential.user.uid, data.ip)
            })

            this.afAuth.fetchSignInMethodsForEmail(credential.user.email)
              .then(res => {
                if (res.length === 1) {
                  if (redirect != undefined) {
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
                  if (redirect != undefined) {
                    return this.ngZone.run(() => {
                      return this.router.navigateByUrl(`${redirect}`);
                    });
                  } else {
                    return this.ngZone.run(() => {
                      return this.router.navigate(['/home']);
                    });
                  }
                }
              })
          }
        });
      })
      .catch(error => {
        return error.code
      })
  }

  /*async facebookSignIn() {
    const provider = new auth.FacebookAuthProvider();
    this.oAuthLogin(provider);
  }*/

  async emailSignUp(email: string, password: string, first_name: string, last_name: string, username: string, userIP: string, inviteCode?: string) {
    if (userIP == undefined) userIP = "null"

    if (email || password || first_name || last_name || username) {
      return this.afAuth.createUserWithEmailAndPassword(email, password)
        .then(user => {
          this.isEmailSignUp = true

          const userData: User = {
            first_name,
            last_name,
            username,
            email: user.user.email,
            uid: user.user.uid,
            listed: 0,
            sold: 0,
            ordered: 0,
            offers: 0,
            is_active: false,
            creation_date: Date.parse(user.user.metadata.creationTime),
            last_known_ip_address: userIP,
            last_login: Date.parse(user.user.metadata.creationTime)
          };

          if (inviteCode != undefined) {
            userData.free_shipping = true;
            this.afs.collection(`users`).doc(`${inviteCode}`).set({
              shippingPromo: {
                sent: true,
                accepted: true
              },
              freeShipping: true
            }, { merge: true }).catch(err => {
              console.error(err);
              this.afAuth.currentUser.then(res => {
                res.delete()
              })
              return false;
            });
          }

          if (isPlatformBrowser(this._platformId)) {
            gtag('event', 'sign_up', {
              'event_category': 'engagement',
              'event_label': 'Email_SignUp'
            });

            if (this.globals.exp001_version != undefined) {
              if (this.globals.exp001_version == 'exp001a') {
                gtag('event', 'exp001a_signup', {
                  'event_category': 'exp001',
                  'event_label': `Email_SignUp`
                })
              } else if (this.globals.exp001_version == 'exp001b') {
                gtag('event', 'exp001b_signup', {
                  'event_category': 'exp001',
                  'event_label': `Email_SignUp`
                })
              } else if (this.globals.exp001_version == 'exp001c') {
                gtag('event', 'exp001c_signup', {
                  'event_category': 'exp001',
                  'event_label': `Email_SignUp`
                })
              } else if (this.globals.exp001_version == 'exp001d') {
                gtag('event', 'exp001d_signup', {
                  'event_category': 'exp001',
                  'event_label': `Email_SignUp`
                })
              }
            }
          }

          return this.createUserData(userData, user);
        })
        .catch(err => {
          return err.code
        })
    } else {
      return false;
    }
  }

  async emailLogin(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password)
      .then((response) => {

        this.ipService.getIPAddress().subscribe((data: any) => {
          this.updateLastActivity(response.user.uid, data.ip)
        })

        this.http.put(`${environment.cloud.url}IntercomData`, { uid: response.user.uid }).subscribe((data: any) => {
          window.Intercom("update", {
            "name": `${data.first_name} ${data.last_name}`, // Full name
            "email": response.user.email, // Email address
            "created_at": response.user.metadata.creationTime, // Signup date as a Unix timestamp
            "user_id": response.user.uid,
            "user_hash": data.hash
          });
        });

        return this.globals.userLoggedIn().then(() => {
          return true;
        }).catch(error => {
          this.signOut(false)
          return false
        })
      })
      .catch(error => {
        console.error('Error Login: Email or Password Invalid.');
        return false;
      });
  }

  private createUserData(user: User, userCred: auth.UserCredential) {
    console.log('createUserDate running...')
    const userRef = this.afs.firestore.collection('users').doc(user.uid)
    const userVerificationRef = this.afs.firestore.collection('userVerification').doc(user.uid)

    const batch = this.afs.firestore.batch()

    batch.set(userRef, user);
    batch.set(userVerificationRef, {
      uid: user.uid,
      username: user.username,
      email: user.email
    });

    return batch.commit()
      .then(() => {
        console.log('User information updated');
        this.emailService.activateAccount();

        this.http.put(`${environment.cloud.url}IntercomData`, { uid: user.uid }).subscribe((data: any) => {
          window.Intercom("update", {
            "name": `${user.first_name} ${user.last_name}`, // Full name
            "email": user.email, // Email address
            "created_at": userCred.user.metadata.creationTime, // Signup date as a Unix timestamp
            "user_id": user.uid,
            "user_hash": data.hash
          });
        });

        fbq('track', 'Lead')

        return true;
      })
      .catch((error) => {
        console.error('batch error');

        this.slack.sendAlert('bugreport', `Error: ${error}\n Data: ${user}`)

        if (this.isEmailSignUp) {
          userCred.user.delete().catch(err => {
            console.error(err);
          });
        }

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

  public addInformationUser(first_name: string, last_name: string, username: string, password: string, userIP: string) {
    if (userIP == undefined) userIP = "null"

    if (this.afAuth.currentUser != null || this.afAuth.currentUser != undefined) {
      return this.afAuth.currentUser.then(currentUser => {
        const credential = auth.EmailAuthProvider.credential(currentUser.email, password);

        return currentUser.linkWithCredential(credential)
          .then((userCredential) => {
            const userData: User = {
              first_name,
              last_name,
              username,
              email: userCredential.user.email,
              uid: userCredential.user.uid,
              listed: 0,
              sold: 0,
              ordered: 0,
              offers: 0,
              is_active: true,
              creation_date: Date.parse(userCredential.user.metadata.creationTime),
              last_known_ip_address: userIP,
              last_login: Date.parse(userCredential.user.metadata.creationTime)
            };

            if (isPlatformBrowser(this._platformId)) {
              gtag('event', 'sign_up', {
                'event_category': 'engagement',
                'event_label': 'Social_Media_SignUp'
              });

              if (this.globals.exp001_version != undefined) {
                if (this.globals.exp001_version == 'exp001a') {
                  gtag('event', 'exp001a_signup', {
                    'event_category': 'exp001',
                    'event_label': `google_signup`
                  })
                } else if (this.globals.exp001_version == 'exp001b') {
                  gtag('event', 'exp001b_signup', {
                    'event_category': 'exp001',
                    'event_label': `google_signup`
                  })
                } else if (this.globals.exp001_version == 'exp001c') {
                  gtag('event', 'exp001c_signup', {
                    'event_category': 'exp001',
                    'event_label': `google_signup`
                  })
                } else if (this.globals.exp001_version == 'exp001d') {
                  gtag('event', 'exp001d_signup', {
                    'event_category': 'exp001',
                    'event_label': `google_signup`
                  })
                }
              }
            }

            return this.createUserData(userData, userCredential);
          })
          .catch((error) => {
            console.error('Account linking error', error);
            this.slack.sendAlert('bugreport', `Account linking: ${error}, Data: ${currentUser.email}`)
            return false;
          });
      }).catch(err => {
        console.error('Getting current user error', err)
        this.slack.sendAlert('bugreport', `this.afAuth.currentUser.then error: ${err}`)
      })
    } else {
      return Promise.resolve(false);
    }
  }

  public linkGoogleToPasswordAccount(password: string) {
    if (this.afAuth.currentUser != null || this.afAuth.currentUser != undefined) {
      return this.afAuth.currentUser
        .then(currentUser => {
          const credential = auth.EmailAuthProvider.credential(currentUser.email, password);

          return currentUser.linkWithCredential(credential)
            .then((userCredential) => {
              return true
            })
            .catch((error) => {
              console.error('Account linking error', error);
              this.slack.sendAlert('bugreport', `Account linking: ${error}, Data: ${currentUser.email}`)
              return false;
            });
        })
        .catch(err => {
          console.error('Getting current user error', err)
          this.slack.sendAlert('bugreport', `this.afAuth.currentUser.then error: ${err}`)
        })
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

  updateLastActivity(userID: string, IP: string) {
    const date = Date.now()

    if (IP != undefined) {
      this.afs.collection('users').doc(`${userID}`).set({
        last_login: date,
        last_known_ip_address: IP
      }, { merge: true });

      this.http.patch(`${environment.cloud.url}updateContact`, {
        uid: userID,
        last_login: date,
        mode: 'login'
      })
    }
  }
}
