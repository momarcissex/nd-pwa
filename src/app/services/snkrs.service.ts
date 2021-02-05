import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SnkrsService {

  constructor(
    private afs: AngularFirestore,
    private http: HttpClient
  ) { }

  getLeaderboard(gameID: string) {
    return this.afs.collection(`snkrs`).doc(`${gameID}`).collection(`users`).ref.orderBy('points', 'desc').limit(25).get();
  }

  getGameID(timestamp): Promise<string[] | boolean> {
    return this.afs.collection(`snkrs`).ref.where('closingDate', '>', timestamp).orderBy('closingDate', 'asc').limit(1).get().then(res => {
      return this.afs.collection(`snkrs`).doc(`${res.docs[0].data().ID}`).collection('questions').ref.where(`closingDate`, '>', timestamp).orderBy('closingDate', 'asc').limit(1).get().then(response => {
        if (res.docs != undefined && response.docs != undefined) {
          if (response.docs[0] == undefined) {
            return [res.docs[0].data().ID, '', res.docs[0].data().openingDate];
          } else if (response.docs[0].data().openingDate > timestamp) {
            return [res.docs[0].data().ID, response.docs[0].data().openingDate, res.docs[0].data().openingDate];
          } else {
            return [res.docs[0].data().ID, response.docs[0].data().ID, res.docs[0].data().openingDate];
          }
          
        } else {
          return false;
        }
      })
    })
  }

  getQuestions(gameID: string, qID: string) {
    return this.afs.collection(`snkrs`).doc(`${gameID}`).collection(`questions`).doc(`${qID}`).ref.get();
  }

  addUserAnswer(payload, uid: string, gameID: string, qID: string) {
    const batch = this.afs.firestore.batch();
    const userQRef = this.afs.firestore.collection(`snkrs`).doc(`${gameID}`).collection('users').doc(`${uid}`).collection(`questions`).doc(`${qID}`);
    const userRef = this.afs.firestore.collection(`snkrs`).doc(`${gameID}`).collection('users').doc(`${uid}`);

    batch.set(userQRef, {
      answers: firebase.firestore.FieldValue.arrayRemove({
        correctAnswer: payload.correctAnswer,
        points: -2,
        userAnswer: ''
      })
    }, { merge: true });

    batch.update(userRef, {
      points: firebase.firestore.FieldValue.increment(2)
    });

    batch.set(userQRef, {
      answers: firebase.firestore.FieldValue.arrayUnion(payload),
      totalPoints: firebase.firestore.FieldValue.increment(payload.points)
    }, { merge: true });

    batch.update(userRef, {
      points: firebase.firestore.FieldValue.increment(payload.points)
    });

    return batch.commit().then(() => {
      return true;
    }).catch((err) => {
      console.error(err);
      return false;
    });
  }

  startGame(UID: string, gameID: string, qID: string): Promise<number | boolean> {
    const userRef = this.afs.collection(`snkrs`).doc(`${gameID}`).collection(`users`).doc(`${UID}`);

    return userRef.collection(`questions`).doc(`${qID}`).ref.get().then(res => {
      if (!res.exists) {
        return userRef.ref.get().then((response): Promise<number | boolean> => {
          if (!response.exists) {
            return this.afs.collection(`users`).doc(`${UID}`).ref.get().then((data): Promise<number | boolean> => {
              if (data.exists) {
                userRef.set({
                  points: 0,
                  username: data.data().username,
                  uid: UID
                });

                return Promise.resolve(0);
              } else {
                // Cannot find the user's information. TO SOLVE
                return Promise.resolve(false);
              }
            }).catch(err => {
              console.error(err);
              return Promise.resolve(false);
            });
          }

          return Promise.resolve(0);
        });
      } else {
        // User is in snkrs collection and has answered questions. return 'user resuming'
        return userRef.collection(`questions`).doc(`${qID}`).ref.get().then(res => {
          return res.data().answers.length as number;
        });
      }
    });
  }

  getGameStats(gameID: string, qID: string, UID: string) {
    const usersRef = this.afs.collection(`snkrs`).doc(`${gameID}`).collection(`users`).doc(`${UID}`).collection(`questions`).doc(`${qID}`);

    return usersRef.ref.get();
  }

  getPoints(gameID: string, UID: string) {
    return this.afs.collection(`snkrs`).doc(`${gameID}`).collection(`users`).doc(`${UID}`).valueChanges();
  }

  getRank(gameID: string, UID: string) {
    const db = this.afs.collection(`snkrs`).doc(`${gameID}`).collection(`users`);

    return db.doc(`${UID}`).ref.get().then(doc => {
      return db.ref.orderBy('points').startAt(doc).get();
    });
  }

  questionViewed(currentQuestion: any, gameID: string, qID: string, UID: string) {
    const batch = firebase.firestore().batch();
    const userQRef = this.afs.firestore.collection(`snkrs`).doc(`${gameID}`).collection(`users`).doc(`${UID}`).collection(`questions`).doc(`${qID}`);
    const userRef = this.afs.firestore.collection(`snkrs`).doc(`${gameID}`).collection('users').doc(`${UID}`);

    batch.set(userQRef, {
      answers: firebase.firestore.FieldValue.arrayUnion({
        correctAnswer: currentQuestion.correctAnswer,
        points: -2,
        userAnswer: ''
      })
    }, { merge: true });

    batch.update(userRef, {
      points: firebase.firestore.FieldValue.increment(-2)
    });

    batch.commit();
  }

  addEmail(email: string, gameID: string, UID: string, username: string) {
    const db = this.afs.collection(`snkrs`).doc(`${gameID}`);
    const userRef = db.collection(`users`).doc(`${UID}`);

    return db.set({
      invitations: firebase.firestore.FieldValue.arrayUnion(email)
    }, { merge: true }).then(() => {
      this.http.post(`${environment.cloud.url}snkrsInvitation`, {
        email,
        username
      }).subscribe();

      return userRef.update({
        points: firebase.firestore.FieldValue.increment(10),
        invitationExtra: true
      }).then(() => {
        return true;
      }).catch(err => {
        console.error(err);
        return false;
      });
    }).catch(err => {
      console.error(err);
      return false;
    });
  }

  getUsername(UID: string, gameID: string) {
    const db = this.afs.collection(`snkrs`).doc(`${gameID}`).collection(`users`).doc(`${UID}`);

    return db.valueChanges();
  }

  getNextTournament(timestamp: number) {
    return this.afs.collection(`snkrs`).ref.where('openingDate', '>', timestamp).orderBy('openingDate', 'asc').limit(1).get();
  }
}
