import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { User } from '../models/user';
import { Observable } from 'rxjs';
import { isUndefined } from 'util';
@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService
  ) { }
}
