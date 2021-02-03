import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Globals } from '../globals';
import { Activity } from '../models/activity';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  constructor(
    private afs: AngularFirestore,
    private globals: Globals
  ) { }

  /**
   * Logs an activity to the database
   * @param product_id the product's unique ID
   * @param event the event to log
   */
  logActivity(product_id: string, event: string) {
    const activity_id = this.randomString(16)
    console.log(activity_id)

    /*let data: Activity = {
      product_id,
      event,
      timestamp: Date.now(),
      user_id: '',
      ip_address: ''
    }

    if (this.globals.uid != undefined) data.user_id = this.globals.uid
    if (this.globals.user_ip != undefined) data.ip_address = this.globals.user_ip


    this.afs.collection('activity').doc(activity_id).set(data)*/
  }

  /**
   * Generate a random string
   * @param string_length lenght of the random string
   * @returns a random string
   */
  randomString(string_length: number) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    let randomstring = '';
    for (var i = 0; i < string_length; i++) {
      const rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
    }

    return randomstring;
  }
}
