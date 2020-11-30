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
    this.homeService.getLatestAsk().subscribe(asks => {
      asks.forEach(ask => {
        if (ask.sellerID != 'zNSB9cdIPTZykSJv7xCoTeueFmk2' && ask.sellerID != 'eOoTdK5Z8IYbbHq7uOc9y8gis5h1' && this.discoveries.length < 200) {
          this.discoveries.push(ask)
        }
      })
    },
      err => {
        console.error(err)
      })
    /*this.homeService.getDiscovery().subscribe(data => {
      data.docs.forEach(element => {
        this.discoveries.push(element.data());
      })
    });*/
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

  newPrice(oldPrice: number) {
    if (oldPrice <= 500) {
      const discount = 17
      const newPrice = oldPrice - discount

      return newPrice
    } else if (oldPrice > 500 && oldPrice <= 750) {
      const discount = oldPrice * 0.035
      const newPrice = oldPrice - discount

      return newPrice
    } else if (oldPrice > 750 && oldPrice <= 1000) {
      const discount = 25
      const newPrice = oldPrice - discount

      return newPrice
    } else if (oldPrice > 1000 && oldPrice <= 1250) {
      const discount = oldPrice * 0.028
      const newPrice = oldPrice - discount

      return newPrice
    } else if (oldPrice > 1250 && oldPrice <= 1500) {
      const discount = 35
      const newPrice = oldPrice - discount

      return newPrice
    } else if (oldPrice > 1500 && oldPrice <= 1750) {
      const discount = 40
      const newPrice = oldPrice - discount

      return newPrice
    } else if (oldPrice > 1750 && oldPrice <= 2000) {
      const discount = 44
      const newPrice = oldPrice - discount

      return newPrice
    } else {
      const discount = 70
      const newPrice = oldPrice - discount

      return newPrice
    }
  }

}
