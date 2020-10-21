import { Component, OnInit, NgZone } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { debounceTime, take, map } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MetaService } from 'src/app/services/meta.service';
import { IpService } from 'src/app/services/ip.service';
import { ToastrService } from 'ngx-toastr';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

export class CustomValidators {

  static username(auth: AuthService) {
    return (control: AbstractControl) => {
      return auth.checkUsername(control.value.toLowerCase()).valueChanges().pipe(
        debounceTime(500),
        take(1),
        map(arr => arr.length ? { usernameAvailable: false } : null)
      );
    };
  }

  static email(auth: AuthService) {
    return (control: AbstractControl) => {
      return auth.checkEmail(control.value).valueChanges().pipe(
        debounceTime(500),
        take(1),
        map(arr => arr.length ? { emailAvailable: false } : null)
      );
    };
  }

  static validName() {
    return (control: AbstractControl) => {
      const isWhitespace = (control.value || '').trim().length === 0;
      const isValid = !isWhitespace;
      return Promise.resolve(isValid ? null : { whitespace: true })
    }
  }

}

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

  faGoogle = faGoogle
  faCircleNotch = faCircleNotch

  public customPatterns = { '0': { pattern: new RegExp('\[a-zA-Z0-9._\]+') } };

  signupForm: FormGroup;

  inviteCode: string;

  loading = false;
  error = false;

  userIP: string;

  redirectURL: string;

  constructor(
    public auth: AuthService,
    private fb: FormBuilder,
    private title: Title,
    private route: ActivatedRoute,
    private meta: MetaService,
    private router: Router,
    private ngZone: NgZone,
    private ipService: IpService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Sign Up | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Sign Up');

    this.redirectURL = this.route.snapshot.queryParams.redirectTo

    this.signupForm = this.fb.group({
      firstName: ['',
        [Validators.minLength(2),
        Validators.required],
        [CustomValidators.validName()]
      ],
      lastName: ['',
        [Validators.minLength(2),
        Validators.required],
        [CustomValidators.validName()]
      ],
      username: ['',
        [Validators.minLength(2),
        Validators.required],
        [CustomValidators.username(this.auth)]
      ],
      email: ['',
        [Validators.required,
        Validators.email],
        [CustomValidators.email(this.auth)]
      ],
      password: ['', [
        Validators.minLength(6),
        Validators.maxLength(25),
        Validators.required
      ]]
    });

    if (this.route.snapshot.queryParams.inviteCode != null || this.route.snapshot.queryParams.inviteCode != undefined) {
      this.inviteCode = this.route.snapshot.queryParams.inviteCode;
    }

    this.ipService.getIPAddress().subscribe(
      (data: any) => {
        if (data.ip === null || data.ip === undefined) {
          this.userIP = "null"
        } else {
          this.userIP = data.ip
        }
      },
      err => {
        this.userIP = "null"
        console.error(err)
      })
  }

  public signup() {
    this.loading = true;
    //console.log('signup called');

    if (this.signupForm.valid) {
      return this.auth.emailSignUp(this.email.value.trim(), this.password.value, this.capitalizeWords(this.firstName.value.trim()), this.capitalizeWords(this.lastName.value.trim()), this.username.value.trim(), this.userIP, this.inviteCode).then(res => {
        if (!res) {
          this.loading = false;
          this.error = true;
          this.reset()
        } else {
          if (res === 'auth/email-already-in-use') {
            this.loading = false
            this.toastr.error('Email already linked to another account.', '', {
              progressBar: true,
              progressAnimation: 'decreasing'
            })
          } else if (res === 'auth/invalid-email') {
            this.loading = false
            this.toastr.error('Invalid Email.', '', {
              progressBar: true,
              progressAnimation: 'decreasing'
            })
          } else if (res === 'auth/operation-not-allowed') {
            this.loading = false
            this.toastr.error('Error. Try again!', '', {
              progressBar: true,
              progressAnimation: 'decreasing'
            })
          } else if (res === 'auth/weak-password') {
            this.loading = false
            this.toastr.error('Your password is weak. Try again!', '', {
              progressBar: true,
              progressAnimation: 'decreasing'
            })
          } else {
            console.log(res)
            this.redirect()
          }
        }
      });
    } else {
      this.loading = false
      this.toastr.error('Please fill in all fields.', '', {
        progressBar: true,
        progressAnimation: 'decreasing'
      })
    }
  }

  capitalizeWords(s: string) {
    const names = s.split(" ")

    return names.map((name) => {
      return name[0].toUpperCase() + name.substring(1)
    }).join(" ")
  }

  redirect() {
    if (this.redirectURL != null || this.redirectURL != undefined) {
      return this.ngZone.run(() => {
        return this.router.navigateByUrl(`${this.redirectURL}`);
      });
    } else {
      return this.ngZone.run(() => {
        return this.router.navigate(['/home']);
      });
    }
  }

  loginRedirect() {
    if (this.redirectURL != null || this.redirectURL != undefined) {
      this.router.navigate(['/login'], {
        queryParams: { redirectTo: this.redirectURL }
      })
    } else {
      this.router.navigate(['/login']);
    }
  }

  reset() {
    setTimeout(() => {
      this.error = false;
    }, 3000);
  }

  googleSignUp() {
    this.auth.googleSignIn()
      .then(res => {
        console.log(res)
        if (res === 'auth/account-exists-with-different-credential') {
          this.toastr.error('This email is already linked to an account. Use your password to login.', '', {
            progressBar: true,
            progressAnimation: 'decreasing'
          })
        } else if (res === 'auth/auth-domain-config-required') {
          this.toastr.error('Oops! Something went wrong. Try later.', '', {
            progressBar: true,
            progressAnimation: 'decreasing'
          })
        } else if (res === 'auth/cancelled-popup-request') {
          // do nothing
        } else if (res === 'auth/operation-not-allowed') {
          this.toastr.error('Oops! Something went wrong. Try login with your password.', '', {
            progressBar: true,
            progressAnimation: 'decreasing'
          })
        } else if (res === 'auth/operation-not-supported-in-this-environment') {
          this.toastr.error('Oops! Something went wrong. Try later.', '', {
            progressBar: true,
            progressAnimation: 'decreasing'
          })
        } else if (res === 'auth/popup-blocked') {
          this.toastr.error('Oops! Something went wrong. Try again.', '', {
            progressBar: true,
            progressAnimation: 'decreasing'
          })
        } else if (res === 'auth/popup-closed-by-user') {
          // do nothing
        } else if (res === 'auth/unauthorized-domain') {
          this.toastr.error('Oops! Something went wrong. Try login with your password.', '', {
            progressBar: true,
            progressAnimation: 'decreasing'
          })
        }
      })
      .catch(err => {
        this.toastr.error('Oops! Something went wrong. Try again.', '', {
          progressBar: true,
          progressAnimation: 'decreasing'
        })
      })
  }

  // Getters
  get firstName() {
    return this.signupForm.get('firstName');
  }

  get lastName() {
    return this.signupForm.get('lastName');
  }

  get username() {
    return this.signupForm.get('username');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

}
