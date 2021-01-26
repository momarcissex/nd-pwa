import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import { isPlatformBrowser } from '@angular/common';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

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

  exp002: boolean[] = [false, false, false, false, false, false]

  constructor(
    private modalService: ModalService,
    private http: HttpClient,
    private router: Router,
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
        } else if (res === 'exp002') {
          this.exp002[0] = true
          gtag('event', 'page1_view', {
            'event_category': 'exp002',
          });
        } else {
          this.close()
        }
      }
    })
  }

  close() {
    if (this.isOpen) {
      document.getElementById('modal').style.background = 'transparent'
      document.getElementById('modal').style.top = '100%';
      this.isOpen = false
      this.giveaway = false
      document.body.style.overflow = 'auto'
    }
  }

  closeExp002(current_page?: string) {
    if (this.isOpen) {
      if (current_page != undefined && current_page === 'page1') {
        gtag('event', 'page1_close_btn', {
          'event_category': 'exp002',
        });
        this.exp002[0] = false
      } else if (current_page != undefined && current_page === 'page2') {
        gtag('event', 'page2_close_btn', {
          'event_category': 'exp002',
        });
        this.exp002[1] = false
      } else if (current_page != undefined && current_page === 'page3') {
        gtag('event', 'page3_close_btn', {
          'event_category': 'exp002',
        });
        this.exp002[2] = false
      } else if (current_page != undefined && current_page === 'page4') {
        gtag('event', 'page4_close_btn', {
          'event_category': 'exp002',
        });
        this.exp002[3] = false
      } else if (current_page != undefined && current_page === 'page5') {
        gtag('event', 'page5_close_btn', {
          'event_category': 'exp002',
        });
        this.exp002[4] = false
      } else if (current_page != undefined && current_page === 'page6') {
        gtag('event', 'page6_close_btn', {
          'event_category': 'exp002',
        });
        this.exp002[5] = false
      }


      document.getElementById('modal').style.background = 'transparent'
      document.getElementById('modal').style.top = '100%';
      this.isOpen = false
      this.giveaway = false
      document.body.style.overflow = 'auto'
    }
  }

  redirect() {
    if (this.isOpen) {
      document.getElementById('modal').style.background = 'transparent'
      document.getElementById('modal').style.top = '100%';
      this.isOpen = false
      this.giveaway = false
      document.body.style.overflow = 'auto'

      this.router.navigateByUrl('giveaway')
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

  previousPage(destination: string) {
    if (destination === 'page1') {
      this.exp002[1] = false
      this.exp002[0] = true

      gtag('event', 'page1_view', {
        'event_category': 'exp002',
      });

      gtag('event', 'page2_back_btn', {
        'event_category': 'exp002',
      });
    } else if (destination === 'page2') {
      this.exp002[2] = false
      this.exp002[1] = true

      gtag('event', 'page2_view', {
        'event_category': 'exp002',
      });

      gtag('event', 'page3_back_btn', {
        'event_category': 'exp002',
      });
    } else if (destination === 'page3') {
      this.exp002[3] = false
      this.exp002[2] = true

      gtag('event', 'page3_view', {
        'event_category': 'exp002',
      });

      gtag('event', 'page4_back_btn', {
        'event_category': 'exp002',
      });
    } else if (destination === 'page4') {
      this.exp002[4] = false
      this.exp002[3] = true

      gtag('event', 'page4_view', {
        'event_category': 'exp002',
      });

      gtag('event', 'page5_back_btn', {
        'event_category': 'exp002',
      });
    } else if (destination === 'page5') {
      this.exp002[5] = false
      this.exp002[4] = true

      gtag('event', 'page5_view', {
        'event_category': 'exp002',
      });

      gtag('event', 'page6_back_btn', {
        'event_category': 'exp002',
      });
    }
  }

  nextPage(destination: string) {
    if (destination === 'page2') {
      this.exp002[0] = false
      this.exp002[1] = true

      gtag('event', 'page2_view', {
        'event_category': 'exp002',
      });

      gtag('event', 'page1_next_btn', {
        'event_category': 'exp002',
      });
    } else if (destination === 'page3') {
      this.exp002[1] = false
      this.exp002[2] = true

      gtag('event', 'page3_view', {
        'event_category': 'exp002',
      });

      gtag('event', 'page2_next_btn', {
        'event_category': 'exp002',
      });
    } else if (destination === 'page4') {
      this.exp002[2] = false
      this.exp002[3] = true

      gtag('event', 'page4_view', {
        'event_category': 'exp002',
      });

      gtag('event', 'page3_next_btn', {
        'event_category': 'exp002',
      });
    } else if (destination === 'page5') {
      this.exp002[3] = false
      this.exp002[4] = true

      gtag('event', 'page5_view', {
        'event_category': 'exp002',
      });

      gtag('event', 'page4_next_btn', {
        'event_category': 'exp002',
      });
    } else if (destination === 'page6') {
      this.exp002[4] = false
      this.exp002[5] = true

      gtag('event', 'page6_view', {
        'event_category': 'exp002',
      });

      gtag('event', 'page5_next_btn', {
        'event_category': 'exp002',
      });
    }
  }

}
