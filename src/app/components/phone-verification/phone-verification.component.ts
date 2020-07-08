import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { isUndefined } from 'util';
import { MetaService } from 'src/app/services/meta.service';
import { isPlatformBrowser } from '@angular/common';
import { SlackService } from 'src/app/services/slack.service';

@Component({
  selector: 'app-phone-verification',
  templateUrl: './phone-verification.component.html',
  styleUrls: ['./phone-verification.component.scss']
})
export class PhoneVerificationComponent implements OnInit, AfterViewInit {

  isValidNumber = false
  islinked = false
  isNotRobot = false
  isSent = false
  linkLoading = false
  verificationLoading = false
  isValidCode = false

  sendError: boolean = false
  sendErrorMessage: string

  verificationError: boolean = false
  verificationErrorMessage: string

  areaCode = '';
  number = '';

  fullNumber: string;

  recaptchaVerifier: firebase.auth.RecaptchaVerifier

  confirmationResult: firebase.auth.ConfirmationResult;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private title: Title,
    private meta: MetaService,
    private slack: SlackService,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) { }

  ngAfterViewInit() {
    if (isPlatformBrowser(this._platformId)) {
      this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('container', {
        'size': 'invisible',
        'callback': (res) => {
          //console.log('recaptcha resolved');
          //console.log(res);
          this.isNotRobot = true;
        },
      });

      this.recaptchaVerifier.render().catch(err => {
        console.error(err);
      });
    }
  }

  ngOnInit() {
    this.title.setTitle(`Phone Verification | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Phone Verification');

    this.verifyAreaCode();
    //console.log(this.route.snapshot.queryParams.redirectTo);
  }

  verifyAreaCode() {
    //const code = (document.getElementById('areaCode') as HTMLInputElement).value;
    this.areaCode = '+1';
    this.validNumber();
    // console.log(this.hasAreacode && this.hasNumber);
  }

  verifyNumber() {
    const number = (document.getElementById('phoneNumber') as HTMLInputElement).value;
    this.number = number;
    this.validNumber();
    // console.log(this.hasNumber && this.hasNumber);
  }

  validNumber() {
    this.fullNumber = this.areaCode + this.number.replace('(', '').replace(')', '').replace('-', '').replace(' ', '');
    if (this.fullNumber.length == 12) {
      this.isValidNumber = true;
    } else {
      this.isValidNumber = false;
    }
  }

  validCode() {
    const code = (document.getElementById('authCode') as HTMLInputElement).value;
    if (code.length === 6) {
      this.isValidCode = true;
    } else {
      this.isValidCode = false;
    }
  }

  sendCode() {
    if (this.isValidNumber) {
      this.linkLoading = true;
      firebase.auth().currentUser.linkWithPhoneNumber(this.fullNumber, this.recaptchaVerifier).then(res => {
        this.isSent = true;
        this.confirmationResult = res;
        this.linkLoading = false;
      }).catch(err => {
        this.linkLoading = false;
        alert(err.code)

        console.log(err)
        console.log(`linkLoading: ${this.linkLoading} and sendError: ${this.sendError}`)
        this.slack.sendAlert('bugreport', `sendCode() err: ${err}`).catch(err => {
          console.error(`sendCode() this.slack.sendAlert(): ${err}`)
        })

        if (err.code == 'auth/too-many-requests') {
          this.sendErrorMessage = 'We have blocked all requests from this device due to unusual activity. Try again later.'
          this.sendError = true;
        } else if (err.code == 'auth/credential-already-in-use') {
          this.sendErrorMessage = 'Phone number associated to another account. Use another phone number.'
          this.sendError = true;
        } else if (err.code == 'auth/user-disabled') {
          this.sendErrorMessage = 'Contact our support team for help. Thanks.'
          this.sendError = true;
        } else if (err.code == 'auth/missing-phone-number' || err.code == 'auth/invalid-phone-number') {
          this.sendErrorMessage = 'Phone number is invalid.'
          this.sendError = true;
        } else if (err.code == 'auth/captcha-check-failed') {
          this.sendErrorMessage = 'Error. Refresh page and try again.'
          this.sendError = true;
        } else if (err.code == 'auth/provider-already-linked') {
          this.sendErrorMessage = 'Phone number already linked to your account.'
          this.sendError = true;
        }

        setTimeout(() => {
          this.isSent = false;
          this.sendError = false
        }, 500);
      });
    }
  }

  verifyCode() {
    if (this.isValidCode) {
      this.verificationLoading = true;
      this.confirmationResult.confirm((document.getElementById('authCode') as HTMLInputElement).value).then((res) => {
        this.back()
      }).catch((err) => {
        console.log(err)
        this.slack.sendAlert('bugreport', `verifyCode() err: ${err}`).catch(err => {
          console.error(`verifyCode() this.slack.sendAlert(): ${err}`)
        })

        this.verificationLoading = false;
        this.verificationError = true

        if (err.code == 'auth/invalid-verification-code') {
          this.verificationErrorMessage = 'Code Invalid.'
        } else if (err.code == 'auth/code-expired') {
          this.verificationErrorMessage = 'Code Expired. Sending new code.'
          this.sendCode()
        } else if (err.code = 'auth/credential-already-in-use') {
          this.verificationErrorMessage = 'Phone number associated to another account. Use another phone number.'
          setTimeout(() => {
            this.isSent = false
          }, 6000);
        }

        setTimeout(() => {
          this.verificationError = false
        }, 5000);
      });
    }
  }

  back() {
    if (isUndefined(this.route.snapshot.queryParams.redirectTo)) {
      this.router.navigate([`..`]);
    } else {
      if (this.route.snapshot.queryParams.redirectTo === 'sell') {
        this.router.navigate([`..`]);
      } else {
        this.router.navigate([`${this.route.snapshot.queryParams.redirectTo}`]);
      }
    }
  }

}
