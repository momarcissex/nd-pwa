import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Ask } from '../models/ask';
import { Product } from '../models/product';

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

    const newReleaseRef = this.afs.collection(`products`, ref => ref.where(`release_date`, `<=`, `${today}`).orderBy(`release_date`, `desc`).limit(20));
    return newReleaseRef.get();
  }

  public getDiscovery(after?) {
    if (after == undefined) {
      after = 0;
    }

    const discoveryRef = this.afs.collection(`products`, ref => ref.orderBy(`discoveryRank`, `asc`).startAfter(after).limit(12));
    return discoveryRef.get();
  }

  public getTrending() {
    const trendingRef = this.afs.collection(`products`, ref => ref.orderBy(`trending_score`, `desc`).limit(20));
    return trendingRef.get();
  }

  public getLatestAsk() {
    return this.afs.collection(`asks`, ref => ref.orderBy('created_at', 'desc').limit(1000)).valueChanges() as Observable<Ask[]>;
  }

  public getLatestBid() {
    return this.afs.collection(`bids`, ref => ref.orderBy('created_at', 'desc').limit(30)).valueChanges();
  }

  public getCollection(collection_id: string) {
    return this.afs.collection('products', ref => ref.where('collections', 'array-contains', collection_id).orderBy('release_date', 'desc')).valueChanges() as Observable<Product[]>;
  }

  public getUpcomingReleases() {
    let t = new Date();
    const dd = String(t.getDate()).padStart(2, '0');
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const yyyy = t.getFullYear();
    const today = `${yyyy}-${mm}-${dd}`;

    const upcoming_releases = this.afs.collection(`products`, ref => ref.where(`release_date`, `>`, `${today}`).orderBy(`release_date`, `asc`).limit(10));
    return upcoming_releases.get();
  }

}
