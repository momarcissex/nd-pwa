import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { MetaService } from 'src/app/services/meta.service';
import { UserService } from 'src/app/services/user.service';
import { SlackService } from 'src/app/services/slack.service';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  connected: boolean = false;
  duties: number = 21482;
  lastSale: any;

  userInfo: User;

  loadIframe: boolean = true

  constructor(
    private title: Title,
    private afs: AngularFirestore,
    private auth: AuthService,
    private seo: MetaService,
    private userService: UserService,
    private slackService: SlackService
  ) { }

  ngOnInit() {
    this.title.setTitle(`NXTDROP: Buy and Sell Sneakers in Canada`);
    this.seo.addTags('Home');

    this.auth.isConnected()
      .then(res => {
        if (res != null || res != undefined) {
          this.connected = true;

          this.userService.getUserInfo(res.uid).subscribe(
            data => {
              this.userInfo = data
            },
            err => {
              //console.error(err)
              this.slackService.sendAlert('bugreport', err)
            }
          )
        } else {
          this.connected = false
        }
      });

    this.afs.collection(`transactions`).get().subscribe(res => {
      let prices: number = 0;

      res.docs.forEach(ele => {
        if (ele.data().paymentID != '' && !ele.data().status.cancelled) {
          prices += ele.data().total;
        }
      });

      prices = prices * .23;

      this.duties += prices;
    });

    this.afs.collection(`transactions`, ref => ref.where('status.cancelled', '==', false).orderBy(`purchaseDate`, `desc`).limit(1)).valueChanges().subscribe(res => {
      res.forEach(ele => {
        this.lastSale = ele;
      });
    });
  }
}
