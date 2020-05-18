import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';

@Component({
  selector: 'app-faq-home',
  templateUrl: './faq-home.component.html',
  styleUrls: ['./faq-home.component.scss']
})
export class FaqHomeComponent implements OnInit {

  constructor(
    private title: Title,
    private seo: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle('FAQ | NXTDROP: Sell and Buy Authentic Sneakers in Canada')
    this.seo.addTags('FAQ')
  }

}
