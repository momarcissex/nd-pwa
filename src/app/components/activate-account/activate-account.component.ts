import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { faCheckCircle, faCircleNotch, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-activate-account',
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.scss']
})
export class ActivateAccountComponent implements OnInit {

  faCheckCircle = faCheckCircle
  faExclamationCircle = faExclamationCircle
  faCircleNotch = faCircleNotch
  
  code: string;
  error = false;
  good = false;


  constructor(
    private route: ActivatedRoute,
    private title: Title,
    private meta: MetaService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.code = this.route.snapshot.queryParams.code;
    this.title.setTitle(`Activate Account | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Activate Account');

    this.http.put(`${environment.cloud.url}activateAccount`, { code: this.code }).subscribe(res => {
      res ? this.good = true : this.error = true;
    });
  }

}
