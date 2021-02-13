import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { debounceTime, take, map } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IpService } from 'src/app/services/ip.service';
import { SlackService } from 'src/app/services/slack.service';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

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
  selector: 'app-signup-information',
  templateUrl: './signup-information.component.html',
  styleUrls: ['./signup-information.component.scss']
})
export class SignupInformationComponent implements OnInit, OnDestroy {

  faCircleNotch = faCircleNotch

  public customPatterns = { '0': { pattern: new RegExp('\[a-zA-Z0-9._\]+') } };

  signupForm: FormGroup;
  accountCreated: boolean;

  loading = false;
  error = false;

  userIP: string

  userDataAvailable: boolean = false
  dataLoaded: boolean = false

  userDataObservable: Subscription

  constructor(
    private auth: AuthService,
    private fb: FormBuilder,
    private title: Title,
    private meta: MetaService,
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    private ipService: IpService,
    private slackService: SlackService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Sign Up | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Sign Up');
    this.accountCreated = false;

    this.auth.isConnected().then(res => {
      //alert(res)
      if (res === null || res === undefined) {
        this.router.navigate(['/signup'])
      } else if (res.providerData[0].providerId != 'google.com' || res.providerData.length > 1) {
        this.router.navigate(['/home'])
      }

      if (res != null || res != undefined) {
        this.userDataObservable = this.auth.getUserData(res.uid)
          .subscribe(
            res => {
              this.signupForm.setValue({
                first_name: `${res.first_name}`,
                last_name: `${res.last_name}`,
                username: `${res.username}`,
                password: ``
              })

              this.userDataAvailable = true
            },
            err => {
              console.error(err)
            }
          )
      }
    })

    this.signupForm = this.fb.group({
      first_name: ['',
        [Validators.minLength(2),
        Validators.required],
        [CustomValidators.validName()]
      ],
      last_name: ['',
        [Validators.minLength(2),
        Validators.required],
        [CustomValidators.validName()]
      ],
      username: ['',
        [Validators.minLength(2),
        Validators.required],
        [CustomValidators.username(this.auth)]
      ],
      password: ['', [
        Validators.minLength(6),
        Validators.maxLength(25)
      ]]
    });

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

    this.dataLoaded = true
  }

  ngOnDestroy() {
    //console.log(this.accountCreated);
    if (!this.accountCreated && !this.userDataAvailable) {
      //console.log('ngOnDestroy')
      //console.log(this.accountCreated)
      this.auth.isConnected().then(res => {
        if (res.providerData.length <= 1) {
          res.delete();
        }
      });
    }

    this.userDataObservable.unsubscribe()
  }

  createUser() {
    //console.log('createUser() called');
    this.loading = true;
    const redirect = this.route.snapshot.queryParams.redirectTo;

    if (this.signupForm.valid) {
      this.auth.addInformationUser(this.capitalizeWords(this.first_name.value.trim()), this.capitalizeWords(this.last_name.value.trim()), this.username.value.trim(), this.password.value, this.userIP)
        .then((res) => {
          if (!res) {
            this.loading = false;
            this.error = true;

            setTimeout(() => {
              this.error = false;
            }, 1000);
          } else {
            this.accountCreated = true;

            if (redirect != null || redirect != undefined) {
              return this.ngZone.run(() => {
                return this.router.navigateByUrl(`${redirect}`);
              });
            } else {
              return this.ngZone.run(() => {
                return this.router.navigate(['/home']);
              });
            }
          }
          //console.log(this.accountCreated);
        })
        .catch(err => {
          console.error(err)
          this.slackService.sendAlert('bugreport', err)
        })
    } else if (this.first_name.valid && this.last_name.valid && this.password.valid && this.userDataAvailable) {
      this.auth.linkGoogleToPasswordAccount(this.password.value)
        .then(res => {
          if (!res) {
            this.loading = false;
            this.error = true;

            setTimeout(() => {
              this.error = false;
            }, 1000);
          } else {
            if (redirect != null || redirect != undefined) {
              return this.ngZone.run(() => {
                return this.router.navigateByUrl(`${redirect}`);
              });
            } else {
              return this.ngZone.run(() => {
                return this.router.navigate(['/home']);
              });
            }
          }
        })
        .catch(err => {
          console.error(err)
          this.slackService.sendAlert('bugreport', err)
        })
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

  // Getters
  get first_name() {
    return this.signupForm.get('first_name');
  }

  get last_name() {
    return this.signupForm.get('last_name');
  }

  get username() {
    return this.signupForm.get('username');
  }

  get password() {
    return this.signupForm.get('password');
  }

}
