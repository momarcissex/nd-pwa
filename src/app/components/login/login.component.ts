import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { isUndefined } from 'util';
import { MetaService } from 'src/app/services/meta.service';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  faGoogle = faGoogle
  faSpinner = faSpinner

  loginForm: FormGroup;

  loading = false;
  error = false;
  usernameError = false;

  redirectURL: string;

  constructor(
    private auth: AuthService,
    private fb: FormBuilder,
    private title: Title,
    private route: ActivatedRoute,
    private router: Router,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Log In | NXTDROP: Buy and Sell Sneakers in Canada`);
    this.meta.addTags('Log In');

    this.redirectURL = this.route.snapshot.queryParams.redirectTo

    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required
      ]],
      password: ['', [
        Validators.required
      ]]
    });
  }

  login() {
    this.loading = true;
    // console.log('login() called');

    if (new RegExp('^.+@.+\.[a-zA-Z]{2,5}$').test(this.email.value)) {
      if (this.email.value || this.password.value) {
        this.auth.emailLogin(this.email.value, this.password.value).then(res => {
          if (!res) {
            this.showError();
          } else {
            this.redirect();
          }
        });
      } else {
        this.showError();
      }
    } else {
      this.usernameError = true;
      this.auth.checkUsername(this.email.value).get().subscribe(res => {
        if (res.docs.length < 1) {
          this.showError()
        } else {
          this.auth.emailLogin(res.docs[0].get('email'), this.password.value).then(res => {
            if (!res) {
              this.showError();
            } else {
              this.redirect();
            }
          });
        }
      })
    }
  }

  private redirect() {
    if (!isUndefined(this.redirectURL)) {
      this.router.navigateByUrl(this.redirectURL);
    } else {
      this.router.navigate(['/home']);
    }
  }

  signUpRedirect() {
    if (!isUndefined(this.redirectURL)) {
      this.router.navigate(['/signup'], {
        queryParams: { redirectTo: this.redirectURL }
      })
    } else {
      this.router.navigate(['/signup']);
    }
  }

  private showError() {
    this.loading = false;
    this.error = true;
    setTimeout(() => {
      this.error = false;
      this.usernameError = false;
    }, 2500);
  }

  public facebookSign() {
    this.auth.facebookSignIn();
  }

  public googleSign() {
    this.auth.googleSignIn();
  }

  // GETTER
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

}
