import { Component, OnInit } from '@angular/core';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-recover-email',
  templateUrl: './recover-email.component.html',
  styleUrls: ['./recover-email.component.scss']
})
export class RecoverEmailComponent implements OnInit {

  faExclamationCircle = faExclamationCircle

  constructor() { }

  ngOnInit() {
  }

}
