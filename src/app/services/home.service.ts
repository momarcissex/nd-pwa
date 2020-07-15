import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { isUndefined } from 'util';
import { Observable } from 'rxjs';
import { Ask } from '../models/ask';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  constructor(
    private afs: AngularFirestore
  ) { }

  public getNewReleases() {
    let t = new Date();
    const dd = String(t.getDate()).padStart(2, '0');
    const mm = String(t.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = t.getFullYear();
    const today = `${yyyy}-${mm}-${dd}`;
    // console.log(today);

    const newReleaseRef = this.afs.collection(`products`, ref => ref.where(`yearMade`, `<=`, `${today}`).orderBy(`yearMade`, `desc`).limit(50));
    return newReleaseRef.get();
  }

  public getDiscovery(after?) {
    if (isUndefined(after)) {
      after = 0;
    }

    const discoveryRef = this.afs.collection(`products`, ref => ref.orderBy(`discoveryRank`, `asc`).startAfter(after).limit(12));
    return discoveryRef.get();
  }

  public getTrending() {
    const trendingRef = this.afs.collection(`products`, ref => ref.orderBy(`trendingRank`, `asc`).limit(50));
    return trendingRef.get();
  }

  public getLatestAsk() {
    return this.afs.collection(`asks`, ref => ref.orderBy('created_at', 'desc').limit(200)).valueChanges() as Observable<Ask[]>;
  }

  public getLatestBid() {
    return this.afs.collection(`bids`, ref => ref.orderBy('created_at', 'desc').limit(30)).valueChanges();
  }

}
