import { Component, OnInit } from '@angular/core';
import { SettingsPasswordService } from 'src/app/services/settings-password.service';
import { EmailService } from 'src/app/services/email.service';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-settings-password',
  templateUrl: './settings-password.component.html',
  styleUrls: ['./settings-password.component.scss']
})
export class SettingsPasswordComponent implements OnInit {

  faCircleNotch = faCircleNotch

  samePwd = false;
  pwdEntered = false;
  newPwdEntered = false;
  errorPwd = false;

  loading = false;
  error = false;
  updated = false;

  constructor(
    private settingsPasswordService: SettingsPasswordService,
    private emailService: EmailService,
    private title: Title,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Change Password | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Change Password');
  }

  pwdChanges($event) {
    const pwd = (document.getElementById('new-pwd') as HTMLInputElement).value;
    const confPwd = (document.getElementById('confirm-new-pwd') as HTMLInputElement).value;

    if (pwd == '') {
      this.pwdEntered = false;
    } else {
      this.pwdEntered = true;
    }

    if (pwd != confPwd) {
      this.samePwd = false;
    } else {
      this.samePwd = true;
    }

    if (confPwd == '') {
      this.newPwdEntered = false;
    } else {
      this.newPwdEntered = true;
    }

    // console.log(this.samePwd + ' ' + this.newPwdEntered);

    this.samePwd && this.newPwdEntered ? this.errorPwd = false : this.errorPwd = true;
  }

  confPwdChanges($event) {
    const pwd = (document.getElementById('new-pwd') as HTMLInputElement).value;
    const confPwd = (document.getElementById('confirm-new-pwd') as HTMLInputElement).value;

    if (pwd != confPwd) {
      this.samePwd = false;
    } else {
      this.samePwd = true;
    }

    if (confPwd == '') {
      this.newPwdEntered = false;
    } else {
      this.newPwdEntered = true;
    }

    // console.log(this.samePwd + ' ' + this.newPwdEntered);

    this.samePwd && this.newPwdEntered ? this.errorPwd = false : this.errorPwd = true;
  }

  updatePassword() {
    const oldPwd = (document.getElementById('old-pwd') as HTMLInputElement).value;
    const pwd = (document.getElementById('new-pwd') as HTMLInputElement).value;

    if (this.pwdEntered && this.newPwdEntered) {
      this.loading = true;
      this.settingsPasswordService.updatePassword(oldPwd, pwd).then(res => {
        if (res) {
          this.emailService.passwordChange();
          this.loading = false;
          this.updated = true;
          this.reset(res);
        } else {
          this.loading = false;
          this.error = true;
          this.reset(res);
        }
      });
    } else {
      return;
    }
  }

  reset(isError) {
    setTimeout(() => {
      this.updated = false;
      this.error = false;
      if (isError) {
        this.newPwdEntered = false;
      this.pwdEntered = false;
      }
    }, 2000);
  }

}
