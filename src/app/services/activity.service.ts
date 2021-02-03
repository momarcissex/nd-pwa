import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';
import { Globals } from '../globals';
import { Activity } from '../models/activity';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  constructor(
    private afs: AngularFirestore,
    private globals: Globals,
    private http: HttpClient
  ) { }

  /**
   * Logs an activity to the database
   * @param product_id the product's unique ID
   * @param event the event to log
   */
  logActivity(product_id: string, event: string) {
    const activity_id = this.randomString(16)

    let data: Activity = {
      product_id,
      event,
      timestamp: Date.now(),
      user_id: '',
      ip_address: ''
    }

    if (this.globals.uid != undefined) data.user_id = this.globals.uid
    if (this.globals.user_ip != undefined) data.ip_address = this.globals.user_ip

    this.afs.collection('activity').doc(activity_id).set(data)
      .then(() => {
        this.http.patch(`${environment.cloud.url}trendingScoreUpdate`, {
          product_id: product_id
        })
          .subscribe(res => {
            console.log(res)
          })
      })
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * Generate a random string
   * @param string_length lenght of the random string
   * @returns a random string
   */
  private randomString(string_length: number) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    let randomstring = '';
    for (var i = 0; i < string_length; i++) {
      const rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
    }

    return randomstring;
  }
}
