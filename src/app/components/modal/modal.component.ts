import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import { isPlatformBrowser } from '@angular/common';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Globals } from 'src/app/globals';

declare const gtag: any;
@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  faTimes = faTimes

  isOpen: boolean = false

  subscribeLoading: boolean = false
  subscribeError: boolean = false
  subscribed: boolean = false
  errorMessage: string = ''

  giveaway: boolean = false
  capture: boolean = false
  discount: boolean = false
  exp001_version: string;

  constructor(
    private modalService: ModalService,
    private http: HttpClient,
    private router: Router,
    public globals: Globals,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) { }

  ngOnInit() {
    this.modalService.open.subscribe(res => {
      if (res === undefined) {
        this.close()
      } else {
        this.open()

        if (res === 'giveaway') {
          this.giveaway = true
        } else if (res === 'capture') {
          (document.getElementById('subscription-email') as HTMLInputElement).value = ''
          this.capture = true
        } else if (res === 'discount') {
          this.discount = true
          document.getElementById('modal-card').classList.add('discount-background')
        } else if (res === 'exp001') {
          this.exp001_version = this.globals.exp001_version
          this.trackVersion('exp001')
        } else {
          this.close()
        }
      }
    })
  }

  close(experiment?: string) {
    if (this.isOpen) {
      document.getElementById('modal').style.background = 'transparent'
      document.getElementById('modal').style.top = '100%';
      this.isOpen = false
      this.giveaway = false
      document.body.style.overflow = 'auto'

      //btn click tracking
      if (experiment != undefined) {
        if (experiment == 'exp001') {
          if (this.globals.exp001_version == 'exp001a') {
            gtag('event', 'exp001a_close_btn', {
              'event_category': 'exp001',
              'event_label': `${this.router.url}`
            })
          } else if (this.globals.exp001_version == 'exp001b') {
            gtag('event', 'exp001b_close_btn', {
              'event_category': 'exp001',
              'event_label': `${this.router.url}`
            })
          } else if (this.globals.exp001_version == 'exp001c') {
            gtag('event', 'exp001c_close_btn', {
              'event_category': 'exp001',
              'event_label': `${this.router.url}`
            })
          } else if (this.globals.exp001_version == 'exp001d') {
            gtag('event', 'exp001d_close_btn', {
              'event_category': 'exp001',
              'event_label': `${this.router.url}`
            })
          }
        }
      }
    }
  }

  redirect(destination: string, experiment?: string) {
    if (this.isOpen) {
      document.getElementById('modal').style.background = 'transparent'
      document.getElementById('modal').style.top = '100%';
      this.isOpen = false
      this.giveaway = false
      document.body.style.overflow = 'auto'

      if (destination === 'giveaway') {
        this.router.navigateByUrl('giveaway')
      } else if (destination === 'home') {
        this.router.navigateByUrl('/')

        //btn click tracking
        if (experiment != undefined) {
          if (experiment == 'exp001') {
            if (this.globals.exp001_version == 'exp001a') {
              gtag('event', 'exp001a_cta_btn', {
                'event_category': 'exp001',
                'event_label': `${this.router.url}`
              })
            } else if (this.globals.exp001_version == 'exp001b') {
              gtag('event', 'exp001b_cta_btn', {
                'event_category': 'exp001',
                'event_label': `${this.router.url}`
              })
            }
          }
        }
      }
    }
  }

  open() {
    this.subscribed = false
    this.subscribeError = false
    this.subscribeLoading = false


    document.body.style.overflow = 'hidden'
    document.getElementById('modal').style.background = 'transparent'
    const element = document.getElementById('modal');
    element.style.height = '100vh';
    this.isOpen = true

    setTimeout(() => {
      document.getElementById('modal').style.background = 'rgba(56, 54, 55, 0.5)'
    }, 1000);
  }

  subscribe() {
    this.subscribeLoading = true;
    this.subscribeError = false;

    if (isPlatformBrowser(this._platformId)) {
      const email = (document.getElementById('subscription-email') as HTMLInputElement).value;
      const regex = RegExp(/^.+@.+\.[a-z]{2,5}$/gm);

      if (regex.test(email)) {
        this.http.put(`${environment.cloud.url}addToNewsletter`, { email: email }).subscribe(res => {
          if (res) {
            this.subscribeLoading = false;
            this.subscribed = true;

            /** Track email capture */
            if (this.globals.exp001_version == 'exp001c') {
              gtag('event', 'exp001c_email_capture', {
                'event_category': 'exp001',
                'event_label': `${this.router.url}`
              })
            } else if (this.globals.exp001_version == 'exp001d') {
              gtag('event', 'exp001d_email_capture', {
                'event_category': 'exp001',
                'event_label': `${this.router.url}`
              })
            }

            setTimeout(() => {
              this.close()
            }, 2000)
          } else {
            this.subscribeLoading = false;
            this.subscribeError = true;

            setTimeout(() => {
              this.subscribeError = false
              this.subscribeLoading = false
            }, 3000);
          }
        });
      } else {
        this.subscribeError = true;
        this.subscribeLoading = false;

        setTimeout(() => {
          this.subscribeError = false
          this.subscribeLoading = false
        }, 3000);
      }
    } else {
      this.subscribeError = true;
      this.subscribeLoading = false;

      setTimeout(() => {
        this.subscribeError = false
        this.subscribeLoading = false
      }, 3000);
    }
  }

  startShopping() {
    this.router.navigate(['/'], {
      queryParams: { holidaysales: true }
    })
    this.close()
  }

  trackVersion(experiment: string) {
    if (experiment === 'exp001') {
      if (this.globals.exp001_version == 'exp001a') {
        gtag('event', 'exp001a_view', {
          'event_category': 'exp001',
          'event_label': `${this.router.url}`
        })
      } else if (this.globals.exp001_version == 'exp001b') {
        gtag('event', 'exp001b_view', {
          'event_category': 'exp001',
          'event_label': `${this.router.url}`
        })
      } else if (this.globals.exp001_version == 'exp001c') {
        gtag('event', 'exp001c_view', {
          'event_category': 'exp001',
          'event_label': `${this.router.url}`
        })
      } else if (this.globals.exp001_version == 'exp001d') {
        gtag('event', 'exp001d_view', {
          'event_category': 'exp001',
          'event_label': `${this.router.url}`
        })
      }
    }
  }

}
