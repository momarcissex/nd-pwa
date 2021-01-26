import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { MetaService } from 'src/app/services/meta.service';
import { UserService } from 'src/app/services/user.service';
import { SlackService } from 'src/app/services/slack.service';
import { User } from 'src/app/models/user';
import { ActivatedRoute } from '@angular/router';

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

  exp003: boolean[] = [false, false, false, false, false, false]
  config: string = ''

  constructor(
    private title: Title,
    private afs: AngularFirestore,
    private auth: AuthService,
    private seo: MetaService,
    private userService: UserService,
    private slackService: SlackService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.title.setTitle(`NXTDROP: Buy and Sell Sneakers in Canada`);
    this.seo.addTags('Home');

    const draw = Math.ceil(Math.random() * 6)

    if (draw == 1) {
      this.exp003[0] = true
      this.config = 'config1'
    } else if (draw == 2) {
      this.exp003[1] = true
      this.config = 'config2'
    } else if (draw == 3) {
      this.exp003[2] = true
      this.config = 'config3'
    } else if (draw == 4) {
      this.exp003[3] = true
      this.config = 'config4'
    } else if (draw == 5) {
      this.exp003[4] = true
      this.config = 'config5'
    } else if (draw == 6) {
      this.exp003[5] = true
      this.config = 'config6'
    }

    /*this.route.queryParams.subscribe(r => {
      if (r.holidaysales && r.holidaysales != undefined) {
        const el = document.getElementById('discount')
        el.scrollIntoView()
      }
    })*/

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
