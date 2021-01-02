import { Component, OnInit } from '@angular/core';
import { HomeService } from 'src/app/services/home.service';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Product } from 'src/app/models/product';

@Component({
  selector: 'app-discovery',
  templateUrl: './discovery.component.html',
  styleUrls: ['./discovery.component.scss']
})
export class DiscoveryComponent implements OnInit {

  faSpinner = faSpinner

  discoveries = []
  best_of_nike = []
  best_of_adidas = []

  loading;

  end = false;

  constructor(
    private homeService: HomeService
  ) { }

  ngOnInit() {
    this.end = true
    /*this.homeService.getDiscovery().subscribe(data => {
      data.docs.forEach(element => {
        this.discoveries.push(element.data());
      })
    });*/

    this.homeService.getCollection('best-of-2020-nike').subscribe(data => {
      //console.log(data.length)

      data.forEach(element => {
        this.best_of_nike.push(element)
      })
    })

    this.homeService.getCollection('best-of-2020-adidas').subscribe(data => {
      //console.log(data.length)

      data.forEach(element => {
        this.best_of_adidas.push(element)
      })
    })
  }

  more() {
    this.loading = true;
    //console.log('more() called');
    /*this.homeService.getDiscovery(this.discoveries.length).subscribe(data => {
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
    });*/
  }

}
