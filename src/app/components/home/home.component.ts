import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AngularFirestore } from '@angular/fire/firestore';
import { MetaService } from 'src/app/services/meta.service';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  connected: boolean = false;
  lastSale: any;

  userInfo: User;

  loadIframe: boolean = true

  constructor(
    private title: Title,
    private afs: AngularFirestore,
    private seo: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`NXTDROP: Buy and Sell Sneakers in Canada`);
    this.seo.addTags('Home');

    this.afs.collection(`transactions`, ref => ref.where('status.cancelled', '==', false).orderBy(`purchase_date`, `desc`).limit(1)).valueChanges().subscribe(res => {
      res.forEach(ele => {
        this.lastSale = ele;
      });
    });
  }
}
