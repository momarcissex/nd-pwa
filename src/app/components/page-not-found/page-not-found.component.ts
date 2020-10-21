import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { MetaService } from 'src/app/services/meta.service';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent implements OnInit {

  faExclamationCircle = faExclamationCircle

  constructor(
    private title: Title,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`404 | NXTDROP: Buy and Sell Sneakers in Canada`);
    this.meta.addTags('404');
  }

}
