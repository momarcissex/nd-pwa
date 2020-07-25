import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import { isNullOrUndefined } from 'util';
import { isPlatformBrowser } from '@angular/common';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  isOpen: boolean = false

  subscribeLoading: boolean = false
  subscribeError: boolean = false
  subscribed: boolean = false
  errorMessage: string = ''

  constructor(
    private modalService: ModalService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) { }

  ngOnInit() {
    this.modalService.open.subscribe(res => {
      if (isNullOrUndefined(res)) {
        this.close()
      } else {
        this.open()
      }
    })
  }

  close() {
    if (this.isOpen) {
      document.getElementById('modal').style.background = 'transparent'
      document.getElementById('modal').style.top = '100%';
      this.isOpen = false
      document.body.style.overflow = 'auto'
    }
  }

  open() {
    (document.getElementById('subscription-email') as HTMLInputElement).value = ''
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

}
