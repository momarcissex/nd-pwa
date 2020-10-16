import { Component, OnInit, NgZone, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements OnInit {

  isMobile: boolean = false;
  
  faSearch = faSearch

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event.target.innerWidth < 768) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  typingTimer;
  doneTypingInterval = 1000;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) { }

  ngOnInit() {
    this.checkWidth();
  }

  search(event) {
    clearTimeout(this.typingTimer);
    if (event.target.value) {
      this.typingTimer = setTimeout(() => {
        return this.ngZone.run(() => {
          return this.router.navigate(['../search'], {
            queryParams: { q: event.target.value }
          });
        });
      }, this.doneTypingInterval);
    }
  }

  checkWidth() {
    if (isPlatformBrowser(this._platformId)) {
      if (window.innerWidth < 768) {
        this.isMobile = true;
      } else {
        this.isMobile = false;
      }
    }
  }

}
