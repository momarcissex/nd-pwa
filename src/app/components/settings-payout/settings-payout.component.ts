import { Component, OnInit } from '@angular/core';
import { faPaypal } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-settings-payout',
  templateUrl: './settings-payout.component.html',
  styleUrls: ['./settings-payout.component.scss']
})
export class SettingsPayoutComponent implements OnInit {

  faPaypal = faPaypal

  constructor() { }

  ngOnInit() {
  }

}
