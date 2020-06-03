import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { EmailService } from 'src/app/services/email.service';
import { MetaService } from 'src/app/services/meta.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  errorPwd = false;

  pwd: string;
  confPwd: string;

  code: string;
  uid: string;
  email: string;

  loading = false;
  error = false;
  reset = false;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private title: Title,
    private emailService: EmailService,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Reset Password | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Reset Password');
    
    this.code = this.route.snapshot.queryParams.code;
    this.uid = this.route.snapshot.queryParams.uid;
    this.email = this.route.snapshot.queryParams.email;
    // console.log(this.code);
    this.pwdChanges();
  }

  pwdChanges() {
    this.pwd = (document.getElementById('new-pwd') as HTMLInputElement).value;
    this.confPwd = (document.getElementById('confirm-new-pwd') as HTMLInputElement).value;

    (this.pwd !== this.confPwd && this.confPwd !== '' && this.pwd !== '') || (this.pwd === this.confPwd && this.confPwd === '') ? this.errorPwd = true : this.errorPwd = false;
  }

  resetPassword() {
    //console.log(`resetPassword called`);
    const pwd = (document.getElementById('new-pwd') as HTMLInputElement).value;
    const confPwd = (document.getElementById('confirm-new-pwd') as HTMLInputElement).value;

    if (pwd === confPwd && confPwd !== '' && this.code !== '' && this.uid !== '' && this.email !== '') {
      this.loading = true;
      this.emailService.resetPassword(this.code, confPwd, this.uid, this.email).subscribe(res => {
        this.loading = false;
        if (res) {
          this.reset = true;
        } else {
          this.error = true;
        }

        setTimeout(() => {
          this.reset = false;
          this.error = false;

          if (res) {
            this.router.navigate(['../login']);
          }
        }, 5000);
      })
    } else {
      this.error = true;

      setTimeout(() => {
        this.error = false;
      }, 2000);
    }
  }



}
