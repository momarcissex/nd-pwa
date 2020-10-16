import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { MetaService } from 'src/app/services/meta.service';

@Component({
  selector: 'app-logged-out',
  templateUrl: './logged-out.component.html',
  styleUrls: ['./logged-out.component.scss']
})
export class LoggedOutComponent implements OnInit {

  faCheckCircle = faCheckCircle

  constructor(
    private title: Title,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`See You Later! | NXTDROP: Buy and Sell Sneakers in Canada`);
    this.meta.addTags('Logged Out');
  }

}
