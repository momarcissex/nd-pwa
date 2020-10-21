import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { User } from 'src/app/models/user';
import { DOCUMENT } from '@angular/common';
import { SlackService } from 'src/app/services/slack.service';

@Component({
  selector: 'app-referral-program',
  templateUrl: './referral-program.component.html',
  styleUrls: ['./referral-program.component.scss']
})
export class ReferralProgramComponent implements OnInit {

  userInfo: User

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private renderer2: Renderer2,
    private slackService: SlackService,
    @Inject(DOCUMENT) private _document
  ) { }

  ngOnInit() {
    this.auth.isConnected().then(res => {
      if (!(res === undefined)) {

        this.userService.getUserInfo(res.uid).subscribe(
          data => {

            this.userInfo = data

            if (!(this.userInfo.email === undefined)) {
              // initialize iframe
              const iframe = document.createElement('iframe')
              iframe.setAttribute('height', '900')
              iframe.setAttribute('width', '100%')
              iframe.setAttribute('src', `//portal.referralcandy.com/embed/hfwnr5kh34gczjg2mniumoeyp-candyjar/?&email=${this.userInfo.email}&fname=${this.userInfo.firstName}&lname=${this.userInfo.lastName}`)
              iframe.setAttribute('frameborder', '0')
              this.renderer2.appendChild(this._document.getElementById('main-container'), iframe)
            }
          },
          err => {
            console.error(err)
            this.slackService.sendAlert('bugreport', err)
          }
        )
      } else {
        // initialize iframe
        const iframe = document.createElement('iframe')
        iframe.setAttribute('height', '900')
        iframe.setAttribute('width', '100%')
        iframe.setAttribute('src', `//portal.referralcandy.com/embed/hfwnr5kh34gczjg2mniumoeyp-candyjar/`)
        iframe.setAttribute('frameborder', '0')
        this.renderer2.appendChild(this._document.getElementById('main-container'), iframe)
      }
    });
  }

}
