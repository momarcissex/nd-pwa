import { Component, OnInit } from '@angular/core';
import { EmailService } from 'src/app/services/email.service';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { faCheck, faCircleNotch } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.scss']
})
export class ForgetPasswordComponent implements OnInit {

  faCircleNotch = faCircleNotch
  faCheck = faCheck

  validEmail = false;
  loading = false;
  error = false;
  sent = false;

  errorMessage: string = '';

  constructor(
    private title: Title,
    private emailService: EmailService,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Forgot Password | NXTDROP: Buy and Sell Sneakers in Canada`);
    this.meta.addTags('Forgot Password');
  }

  sendLink() {
    const email = (document.getElementById('inputEmail') as HTMLInputElement).value;
    this.loading = true;
    if (this.validEmail) {
      this.emailService.sendResetLink(email).then(res => {
        if (typeof res === 'boolean') {
          this.loading = false
          this.error = true

          this.errorMessage = 'Email not found.'

          this.resetButtons()
        } else {
          res.subscribe(data => {
            this.loading = false;
            if (data) {
              this.sent = true;
            } else {
              this.error = true;
              this.errorMessage = 'Email Delivery Failed. Try later.'
            }

            this.resetButtons()
          });
        }
      });
    }
  }

  verifyEmail() {
    const email = (document.getElementById('inputEmail') as HTMLInputElement).value;
    const pattern = new RegExp('^.+@.+[.][a-zA-Z]+$');

    if (pattern.test(email)) {
      this.validEmail = true;
    } else {
      this.validEmail = false;
    }
  }

  private resetButtons() {
    setTimeout(() => {
      this.error = false;
      this.sent = false;
    }, 5000);
  }

}
