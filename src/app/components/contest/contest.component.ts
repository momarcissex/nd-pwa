import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { IpService } from 'src/app/services/ip.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-contest',
  templateUrl: './contest.component.html',
  styleUrls: ['./contest.component.scss']
})
export class ContestComponent implements OnInit {

  // boolean
  validEntry: boolean = false
  validEmail: boolean = false
  validHandle: boolean = false
  validSize: boolean = false
  entrySubmitting: boolean = false
  entrySubmitted: boolean = false
  entrySubmitError: boolean = false

  email: string
  handle: string
  size: string
  ip_address: string
  errorMessage: string

  constructor(
    private afs: AngularFirestore,
    private ipService: IpService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.ipService.getIPAddress().subscribe(
      (data: any) => {
        this.ip_address = data.ip
      },
      err => {
        console.error(err)
        this.ip_address = 'unknown'
      }
    )
  }

  emailChanges() {
    this.email = (document.getElementById('email') as HTMLInputElement).value
    const pattern = new RegExp(/.+@.+\.[a-zA-Z]{2,}/gm)

    if (pattern.test(this.email)) {
      this.validEmail = true
    } else {
      this.validEmail = false
    }

    this.validEmail && this.validHandle && this.validSize ? this.validEntry = true : this.validEntry = false
  }

  handleChanges() {
    this.handle = (document.getElementById('handle') as HTMLInputElement).value

    if (this.handle.length > 2) {
      this.validHandle = true
    } else {
      this.validHandle = false
    }

    this.validEmail && this.validHandle && this.validSize ? this.validEntry = true : this.validEntry = false
  }

  sizeChanges() {
    this.size = (document.getElementById('size') as HTMLInputElement).value

    if (this.size.length > 2) {
      this.validSize = true
    } else {
      this.validSize = false
    }

    this.validEmail && this.validHandle && this.validSize ? this.validEntry = true : this.validEntry = false
  }

  submitEntry() {
    const id = this.makeid(10)
    this.entrySubmitting = true

    this.afs.collection('contest').doc(id).set({
      email: this.email,
      handle: this.handle,
      size: this.size,
      created_at: Date.now(),
      ip_address: this.ip_address,
      user_agent: navigator.userAgent
    })
      .then(response => {
        this.entrySubmitting = false
        this.entrySubmitted = true

        this.http.post(`${environment.cloud.url}enterGiveaway`, {
          email: this.email
        }).subscribe()
      })
      .catch(err => {
        console.error(err)
        this.errorMessage = 'Cannot submit entry. Try again.'
        this.entrySubmitting = false
        this.entrySubmitError = true

        setTimeout(() => {
          this.entrySubmitError = false
          this.errorMessage = ''
        }, 3000);
      })
  }

  private makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

}
