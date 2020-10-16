import { Component, OnInit } from '@angular/core';
import { HomeService } from 'src/app/services/home.service';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-discovery',
  templateUrl: './discovery.component.html',
  styleUrls: ['./discovery.component.scss']
})
export class DiscoveryComponent implements OnInit {

  faSpinner = faSpinner

  discoveries = [];

  loading;

  end = false;

  constructor(
    private homeService: HomeService
  ) { }

  ngOnInit() {
    this.homeService.getDiscovery().subscribe(data => {
      data.docs.forEach(element => {
        this.discoveries.push(element.data());
      })
    });
  }

  more() {
    this.loading = true;
    //console.log('more() called');
    this.homeService.getDiscovery(this.discoveries.length).subscribe(data => {
      //console.log(data.docs.length);
      if (data.docs.length == 0) {
        this.loading = false;
        this.end = true;
        //console.log(this.end);
      } else {
        data.docs.forEach(ele => {
          this.discoveries.push(ele.data());
        });
        this.loading = false;
      }
    });
  }

}
