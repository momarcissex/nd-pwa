import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-phone-verification',
  templateUrl: './phone-verification.component.html',
  styleUrls: ['./phone-verification.component.scss']
})
export class PhoneVerificationComponent implements OnInit, AfterViewInit {

  isValidNumber = false;
  islinked = false;
  isNotRobot = false;
  isSent = false;
  linkLoading = false;
  verificationLoading = false;
  isValidCode = false;

  areaCode = '';
  number = '';

  fullNumber: string;

  recaptchaVerifier;

  confirmationResult;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngAfterViewInit() {
    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('container', {
      'size': 'invisible',
      'callback': (res) => {
        console.log('recaptcha resolved');
        console.log(res);
        this.isNotRobot = true;
      },
      'expired-callback': (res) => {
        console.error(res);
      }
    });
    
    this.recaptchaVerifier.render().then(res => {
      console.log(res);
    }).catch(err => {
      console.error(err);
    });
  }

  ngOnInit() {
    console.log(this.route.snapshot.queryParams.redirectTo);
  }

  verifyAreaCode() {
    const code = (document.getElementById('areaCode') as HTMLInputElement).value;
    this.areaCode = code;
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
        console.error(err);
        this.linkLoading = false;
        this.isSent = false;
      });
    }
  }

  verifyCode() {
    if (this.isValidCode) {
      this.verificationLoading = true;
      this.confirmationResult.confirm((document.getElementById('authCode') as HTMLInputElement).value).then(() => {
        this.router.navigate([`../${this.route.snapshot.queryParams.redirectTo}`]);
      }).catch((err) => {
        console.error(err);
        this.verificationLoading = false;
      });
    }
  }

}
