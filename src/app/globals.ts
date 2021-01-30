import { Injectable } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { first, map } from 'rxjs/operators';
import { User } from './models/user';
import { SlackService } from './services/slack.service';

@Injectable()
export class Globals {
    exp001_version: string;
    exp003_version: string;
    user_data: User;
    uid: string;

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

        return this.auth.currentUser.then(res => {
            if (res != undefined) {
                this.uid = res.uid

                return this.afs.collection('users').doc(this.uid).get().pipe(
                    map(user => this.user_data = user.data() as User),
                    first()
                ).toPromise()
            }
        }).catch(err => {
            this.slack.sendAlert('bugreport', err)
        })
    }
}