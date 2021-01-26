import { Injectable } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { first, map } from 'rxjs/operators';
import { User } from './models/user';

@Injectable()
export class Globals {
    user_data: User;
    uid: string;

    constructor(private afs: AngularFirestore, private afAuth: AngularFireAuth) { this.load() }

    load() {
        return this.afAuth.authState.pipe(
            map(user => {
                this.uid = user.uid
                return this.afs.collection('users').doc(this.uid).get().pipe(
                    map(res => this.user_data = res.data() as User),
                    first()
                ).toPromise()
            }),
            first()
        ).toPromise()
    }

}