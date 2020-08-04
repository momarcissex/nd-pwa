import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as algoliasearch from 'algoliasearch';
import { environment } from 'src/environments/environment';
import { Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { MetaService } from 'src/app/services/meta.service';

declare const fbq: any;

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  algoliaClient = algoliasearch(environment.algolia.appId, environment.algolia.apiKey);
  index;

  queryParam: string;

  results;

  nbPages: number = 1;
  searchLimit: boolean = false;

  typingTimer;
  doneTypingInterval = 1000;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private title: Title,
    @Inject(PLATFORM_ID) private _platformId: Object,
    private meta: MetaService
  ) { }

  ngOnInit() {
    this.title.setTitle(`Search | NXTDROP: Sell and Buy Authentic Sneakers in Canada`);
    this.meta.addTags('Search');

    if (isPlatformBrowser(this._platformId)) {
      const element = document.getElementById('search-input');
      element.focus();
      this.activatedRoute.queryParams.subscribe(data => {
        this.queryParam = data.q;
        (element as HTMLInputElement).value = this.queryParam;
      });
      this.index = this.algoliaClient.initIndex(environment.algolia.index);
      this.search();
    }
  }

  search() {
    //console.log(event.target.value);

    const term = (document.getElementById('search-input') as HTMLInputElement).value;

    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.router.navigate([],
        {
          queryParams: { q: term }
        });

      this.index.search({
        query: term,
        attributesToRetrieve: ['assetURL', 'model', 'productID', 'lowestPrice'],
        hitsPerPage: 48 * this.nbPages

      }, (err, hits: any = {}) => {
        if (err) throw err;

        this.results = hits.hits;

        if (hits.nbPages <= this.nbPages || hits.nbPages === 0) {
          this.searchLimit = true;
        } else {
          this.searchLimit = false
        }

        //console.log(this.nbPages);
        //console.log(hits);

        fbq('track', 'Search', {
          content_category: 'sneaker',
          search_string: `${term}`
        })
      });
    }, this.doneTypingInterval);
  }

  moreProducts() {
    this.nbPages++;
    this.search();
  }

}
