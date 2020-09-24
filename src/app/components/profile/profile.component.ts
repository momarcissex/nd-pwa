import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { User } from 'src/app/models/user';
import { Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { MetaService } from 'src/app/services/meta.service';
import { UserService } from 'src/app/services/user.service';
import { Bid } from 'src/app/models/bid';
import { BidService } from 'src/app/services/bid.service';
import { Ask } from 'src/app/models/ask';
import { AskService } from 'src/app/services/ask.service';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  dashInfo: User = {
    sold: 0,
    listed: 0,
    ordered: 0,
    offers: 0,
    uid: '',
    email: '',
    isActive: false,
    creation_date: 0,
    firstName: '',
    lastName: '',
    username: ''
  };

  listings: Ask[] = [];
  offers = [];

  listingNav = true;

  loading = false;

  current_date = Date.now()

  ask_filter: 'All' | 'Active' | 'Expired' | 'Oldest' | 'Recent' = 'All'
  bid_filter: 'All' | 'Active' | 'Expired' | 'Oldest' | 'Recent' = 'All'

  constructor(
    private userService: UserService,
    private title: Title,
    private bidService: BidService,
    private askService: AskService,
    @Inject(PLATFORM_ID) private _platoformId: Object,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Your profile | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Profile');

    if (isPlatformBrowser(this._platoformId)) {
      this.userService.getUserData().then(val => {
        val.subscribe(data => {
          this.dashInfo = data;
        });
      });

      const listingElement = document.getElementById('listingsBtn');
      const offerElement = document.getElementById('offersBtn');

      listingElement.addEventListener('mouseover', () => {
        listingElement.style.borderBottom = '4px solid #222021';
      });

      offerElement.addEventListener('mouseover', () => {
        offerElement.style.borderBottom = '4px solid #222021';
      });

      listingElement.addEventListener('mouseleave', () => {
        if (!this.listingNav) {
          listingElement.style.borderBottom = '2px solid #222021';
        }
      });

      offerElement.addEventListener('mouseleave', () => {
        if (this.listingNav) {
          offerElement.style.borderBottom = '2px solid #222021';
        }
      });

      this.showListings();
    }
  }

  showListings(filterChange?: boolean) {
    if (isPlatformBrowser(this._platoformId)) {
      document.getElementById('listingsBtn').style.borderBottom = '4px solid #222021';
      document.getElementById('offersBtn').style.borderBottom = '2px solid #222021';
    }

    this.listingNav = true;

    if (!isNullOrUndefined(filterChange)) {
      this.listings.length = 0
      this.userService.getUserListings(this.ask_filter).then(val => {
        val.subscribe(data => {
          data.forEach(element => {
            this.listings.push(element.data() as Ask)
          })
          //console.log(data);
        });
      });
    } else {
      if (!this.listings.length) {
        this.userService.getUserListings(this.ask_filter).then(val => {
          val.subscribe(data => {
            data.forEach(element => {
              this.listings.push(element.data() as Ask)
            })
            //console.log(data);
          });
        });
      }
    }
  }

  moreListings() {
    this.userService.getUserListings(this.ask_filter, this.listings[this.listings.length - 1])
      .then(val => {
        val.subscribe(data => {
          data.forEach(element => {
            this.listings.push(element.data() as Ask);
          });
          // console.log(this.listings);
        });
      });
  }

  showOffers(filterChange?: boolean) {
    if (isPlatformBrowser(this._platoformId)) {
      document.getElementById('offersBtn').style.borderBottom = '4px solid #222021';
      document.getElementById('listingsBtn').style.borderBottom = '2px solid #222021';
    }

    this.listingNav = false;

    if (isNullOrUndefined(filterChange)) {
      this.userService.getUserOffers(this.bid_filter).then(val => {
        val.subscribe(data => {
          data.forEach(element => {
            this.offers.push(element.data())
          })
          //console.log(this.offers);
        });
      });
    } else {
      if (!this.offers.length) {
        this.userService.getUserOffers(this.bid_filter).then(val => {
          val.subscribe(data => {
            data.forEach(element => {
              this.offers.push(element.data())
            })
            //console.log(this.offers);
          });
        });
      }
    }
  }

  moreOffers() {
    this.userService.getUserListings(this.offers[this.offers.length - 1].created_at)
      .then(val => {
        val.subscribe(data => {
          data.forEach(element => {
            this.offers.push(element.data());
          });
          // console.log(this.offers);
        });
      });
  }

  removeBid(bid: Bid) {
    document.getElementById(`remove-bid-${bid.offerID}`).innerHTML = 'Removing...'

    this.bidService.deleteBid(bid)
      .then(res => {
        if (res) {
          const index = this.offers.indexOf(bid)

          if (index > -1) {
            this.offers.splice(index, 1)
          }
        } else {
          this.removeErrorBtn(bid.offerID)
        }
      })
      .catch(err => {
        console.error(err)
        this.removeErrorBtn(bid.offerID)
      })
  }

  removeAsk(ask: Ask) {
    document.getElementById(`remove-ask-${ask.listingID}`).innerHTML = 'Removing...'

    this.askService.deleteAsk(ask)
      .then(res => {
        if (res) {
          const index = this.listings.indexOf(ask)

          if (index > -1) {
            this.listings.splice(index, 1)
          }
        } else {
          this.removeErrorBtn(ask.listingID)
        }
      })
      .catch(err => {
        console.error(err)
        this.removeErrorBtn(ask.listingID)
      })
  }

  extendAsk(ask: Ask) {
    document.getElementById(`extend-ask-${ask.listingID}`).innerHTML = 'Extending...'

    this.askService.extendAsk(ask)
      .then(response => {
        if (typeof response === 'boolean') {
          this.extendErroBtn(`extend-ask-${ask.listingID}`)
        } else {
          const index = this.listings.indexOf(ask)

          this.listings[index] = response
        }
      })
      .catch(err => {
        console.error(err)
        this.extendErroBtn(`extend-ask-${ask.listingID}`)
      })
  }

  extendBid(bid: Bid) {
    document.getElementById(`extend-bid-${bid.offerID}`).innerHTML = 'Extending...'

    this.bidService.extendBid(bid)
      .then(response => {
        if (typeof response === 'boolean') {
          this.extendErroBtn(`extend-bid-${bid.offerID}`)
        } else {
          const index = this.offers.indexOf(bid)

          this.offers[index] = response
        }
      })
      .catch(err => {
        console.error(err)
        this.extendErroBtn(`extend-bid-${bid.offerID}`)
      })
  }

  changeFilter(mode: 'All' | 'Active' | 'Expired' | 'Oldest' | 'Recent', isAsk: boolean) {
    if (isAsk) {
      if (this.ask_filter != mode) {
        this.ask_filter = mode
        this.showListings(true)
      }
    } else {
      if (this.bid_filter != mode) {
        this.bid_filter = mode
        this.showOffers(true)
      }
    }

    document.getElementById('dropdown').style.display = 'none'
  }

  dropdown() {
    if (getComputedStyle(document.querySelector('.dropdown-selection')).display === 'none') {
      document.getElementById('dropdown').style.display = 'block'
    } else {
      document.getElementById('dropdown').style.display = 'none'
    }
  }

  removeErrorBtn(id) {
    document.getElementById(`ask-${id}`).innerHTML = 'Error'

    setTimeout(() => {
      document.getElementById(`ask-${id}`).innerHTML = 'Remove'
    }, 3000);
  }

  extendErroBtn(id) {
    document.getElementById(id).innerHTML = 'Error'


    setTimeout(() => {
      document.getElementById(id).innerHTML = 'Extend'
    }, 3000);
  }

}
