import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import { isPlatformBrowser } from '@angular/common';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

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
  exp001: boolean = false

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
        } else if (res === 'exp001') {
          this.exp001 = true
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

}
