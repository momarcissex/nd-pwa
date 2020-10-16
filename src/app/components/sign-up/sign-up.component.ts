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
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

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
  faSpinner = faSpinner

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
        Validators.maxLength(25)
      ]]
    });

    if (this.route.snapshot.queryParams.inviteCode === null || this.route.snapshot.queryParams.inviteCode === undefined) {
      this.inviteCode = this.route.snapshot.queryParams.inviteCode;
    }

    this.ipService.getIPAddress().subscribe((data: any) => {
      this.userIP = data.ip
    })
  }

  public signup() {
    this.loading = true;
    //console.log('signup called');

    if (this.signupForm.valid) {
      if (this.inviteCode === null || this.inviteCode === undefined) {
        return this.auth.emailSignUp(this.email.value, this.password.value, this.firstName.value, this.lastName.value, this.username.value, this.userIP).then(res => {
          if (!res) {
            this.loading = false;
            this.error = true;
            this.reset()
          } else {
            this.redirect()
          }
        });
      } else {
        return this.auth.emailSignUp(this.email.value, this.password.value, this.firstName.value, this.lastName.value, this.username.value, this.userIP, this.inviteCode).then(res => {
          if (!res) {
            this.loading = false;
            this.error = true;
            this.reset()
          } else {
            this.redirect()
          }
        });
      }
    } else {
      this.loading = false
      this.toastr.error('Please fill in all fields.', '', {
        progressBar: true,
        progressAnimation: 'decreasing'
      })
    }
  }

  redirect() {
    if (this.redirectURL === null || this.redirectURL === undefined) {
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
    if (this.redirectURL === null || this.redirectURL === undefined) {
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
    }, 2000);
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
