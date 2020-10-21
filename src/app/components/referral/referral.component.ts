import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { SlackService } from 'src/app/services/slack.service';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

declare const gtag: any;

@Component({
  selector: 'app-referral',
  templateUrl: './referral.component.html',
  styleUrls: ['./referral.component.scss']
})
export class ReferralComponent implements OnInit {

  faCircleNotch = faCircleNotch

  sent: boolean = false;
  error: boolean = false;
  loading: boolean = false;
  phoneNumber: number;

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private afs: AngularFirestore,
    private routre: Router,
    private cookie: CookieService,
    private slack: SlackService
  ) { }

  ngOnInit() {
    this.cookie.delete('phoneInvitation');
    this.cookie.set('phoneInvitation', 'true', 7, '/');
  }

  sendInvite() {
    this.loading = true;
    this.phoneNumber = +(((document.getElementById('phone-number') as HTMLInputElement).value).replace(/\(|\)|\+|\-|\s/g, ""));

    this.auth.isConnected().then(res => {

      if (res === undefined || isNaN(this.phoneNumber) || this.phoneNumber === undefined) {
        this.loading = false;
        this.error = true;
      } else {
        this.afs.collection(`users`).doc(`${res.uid}`).get().subscribe(response => {
          let name;
          (response.data().lastName === undefined) ? name = response.data().firstName : name = response.data().firstName + response.data().lastName;

          const data = {
            phoneNumber: this.phoneNumber,
            name
          }

          this.http.post(`${environment.cloud.url}inviteFriend`, data).subscribe(message => {
            this.loading = false;

            if (message) {
              
              gtag('event', 'referral', {
                'event_category': 'engagement'
              });

              this.slack.sendAlert('others', `${res.uid} sent an invitation to ${this.phoneNumber}`);

              this.sent = true;
              this.cookie.delete('phoneInvitation');
              this.cookie.set('phoneInvitation', 'true', 100, '/');
              this.routre.navigate(['..']);
            } else {
              this.error = true;
            }
          })
        });
      }

      setTimeout(() => {
        this.error = false;
        this.sent = false;
      }, 2000)
    });
  }

}
