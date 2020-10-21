import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { MetaService } from 'src/app/services/meta.service';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit {
  
  faQuestionCircle = faQuestionCircle

  constructor(
    private title: Title,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Contact Us | NXTDROP: Buy and Sell Sneakers in Canada`);
    this.meta.addTags('Contacts Us');
  }

}
