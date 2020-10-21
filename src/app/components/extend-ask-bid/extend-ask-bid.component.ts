import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { faCheckCircle, faCircleNotch, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-extend-ask-bid',
  templateUrl: './extend-ask-bid.component.html',
  styleUrls: ['./extend-ask-bid.component.scss']
})
export class ExtendAskBidComponent implements OnInit {

  faCircleNotch = faCircleNotch
  faCheckCircle = faCheckCircle
  faExclamationCircle = faExclamationCircle

  mode: string;
  user_id: string;
  good: boolean = false
  error: boolean = false
  loading: boolean = true

  constructor(
    private route: ActivatedRoute,
    private title: Title,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.title.setTitle(`NXTDROP: Sell and Buy Sneakers in Canada`)
    this.mode = this.route.snapshot.params.mode
    this.user_id = (this.route.snapshot.params.id as string).split('-')[0]

    console.log(`mode: ${this.mode} user_id: ${this.user_id}`)

    this.http.patch(`${environment.cloud.url}extendAskBid`, {
      mode: this.mode,
      user_id: this.user_id,
      id: this.route.snapshot.params.id
    })
      .subscribe(
        res => {
          res ? this.good = true : this.error = true;
          this.loading = false
        },
        err => {
          this.loading = false
          this.error = true
          console.error(err)
        });
  }

}
