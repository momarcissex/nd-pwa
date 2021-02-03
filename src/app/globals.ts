import { Injectable } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { User } from './models/user';
import { IpService } from './services/ip.service';
import { SlackService } from './services/slack.service';

@Injectable()
export class Globals {
    exp001_version: string;
    exp003_version: string;
    recently_viewed_clicks: string[] = []


    user_data: User;
    uid: string;
    user_ip: string;

    user_subscription: Subscription;

    constructor(private afs: AngularFirestore, private auth: AngularFireAuth, private slack: SlackService, private ipService: IpService) { }

    load() {
        this.pickExp001PopUp()
        this.pickExp003Config()

        return this.auth.authState.pipe(first()).toPromise().then(res => {
            if (res != undefined) {
                this.uid = res.uid

                this.updateUserInfo()

                return this.afs.collection('users').doc(this.uid).get().pipe(
                    map(user => this.user_data = user.data() as User),
                    first()
                ).toPromise()
                    .then(() => {
                        return this.ipService.getIPAddress().pipe(
                            map((data: any) => this.user_ip = data.ip),
                            first()
                        ).toPromise()
                    })
            }
        }).catch(err => {
            this.slack.sendAlert('bugreport', err)
        })
    }

    /**
     * Pick pop-up to display for exp001
     */
    pickExp001PopUp() {
        const draw = Math.floor(Math.random() * Math.floor(3))

        if (draw == 0) {
            this.exp001_version = 'exp001a'
        } else if (draw == 1) {
            this.exp001_version = 'exp001b'
        } else if (draw == 2) {
            this.exp001_version = 'exp001c'
        } else {
            this.exp001_version = 'exp001d'
        }
    }

    /**
     *  Pick a configuration for exp003
     */
    pickExp003Config() {
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
    }

    /**
     * Update user's info in real-time
     */
    updateUserInfo() {
        this.user_subscription = this.afs.collection('users').doc(this.uid).valueChanges().subscribe(res => {
            this.user_data = res as User
        })
    }
}