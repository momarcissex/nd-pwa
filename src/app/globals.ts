import { Injectable } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { User } from './models/user';
import { SlackService } from './services/slack.service';

@Injectable()
export class Globals {
    exp001_version: string;
    exp003_version: string;
    user_data: User;
    uid: string;

    user_subscription: Subscription;

    constructor(private afs: AngularFirestore, private auth: AngularFireAuth, private slack: SlackService) { }

    load() {
        const draw = Math.floor(Math.random() * Math.floor(6))

        if (draw == 0) {
            this.exp003_version = 'config1'
        } else if (draw == 1) {
            this.exp003_version = 'config2'
        } else if (draw == 2) {
            this.exp003_version = 'config3'
        } else if (draw == 3) {
            this.exp003_version = 'config4'
        } else if (draw == 4) {
            this.exp003_version = 'config5'
        } else if (draw == 5) {
            this.exp003_version = 'config6'
        }

        return this.auth.authState.pipe(
            map(auth_response => {
                if (auth_response != undefined) {
                    this.uid = auth_response.uid

                    this.updateUserData()

                    return this.afs.collection('users').doc(this.uid).get().pipe(
                        map(user => this.user_data = user.data() as User),
                        first()
                    ).toPromise()
                }
            }),
            first()
        ).toPromise()
            .catch(err => {
                this.slack.sendAlert('bugreport', err)
            })
    }

    updateUserData() {
        this.user_subscription = this.afs.collection('users').doc(this.uid).valueChanges().subscribe(res => {
            this.user_data = res as User
        })
    }
}