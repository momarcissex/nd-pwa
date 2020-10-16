import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/services/auth.service';
import { SlackService } from 'src/app/services/slack.service';
import { MetaService } from 'src/app/services/meta.service';
import { isNullOrUndefined } from 'util';
import { faCheck, faCircleNotch } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.scss']
})
export class RequestComponent implements OnInit {

  faCircleNotch = faCircleNotch
  faCheck = faCheck

  loading = false;
  error = false;
  sent = false;
  userEmail: string;
  connected = false;

  constructor(
    private title: Title,
    private auth: AuthService,
    private slack: SlackService,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Request Product | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Request Product');

    this.auth.isConnected().then(res => {
      if (!isNullOrUndefined(res)) {
        this.userEmail = res.email;
        this.connected = true
      }
    });
  }

  sendRequest() {
    this.loading = true;
    const products = (document.getElementById('input-request') as HTMLInputElement).value;
    let msg: string;

    if (this.connected) {
      msg = `${this.userEmail} requested ${products}`;
    } else {
      const email = (document.getElementById('email-input') as HTMLInputElement).value;
      msg = `${email} requested ${products}`;
    }

    if (products) {
      this.slack.sendAlert('requests', msg).then(res => {
        console.log(res);
        this.loading = false;
        this.sent = true;
      }).catch(err => {
        console.error(err);
        this.loading = false;
        this.error = true;
      });
    } else {
      this.loading = false;
    }

    setTimeout(() => {
      this.loading = false;
      this.error = false;
      this.sent = false;
    }, 2000);
  }

}
