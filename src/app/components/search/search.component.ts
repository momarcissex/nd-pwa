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

  nbPages: number = 1
  searchLimit: boolean = false
  nbHits: number = 0

  categorySelected: string[] = []
  sizeSelected: string[] = []

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

        this.results = hits.hits
        this.nbHits = hits.nbHits

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

  selectCategory($event) {
    if (this.categorySelected.indexOf($event.target.id) != -1) {
      this.categorySelected.splice(this.categorySelected.indexOf($event.target.id), 1);
      (document.getElementById(`${$event.target.id}`) as HTMLInputElement).classList.remove('categorySelected')
    } else {
      this.categorySelected.push($event.target.id);
      (document.getElementById(`${$event.target.id}`) as HTMLInputElement).classList.add('categorySelected')
    }

    //console.log(this.categorySelected)
  }

  selectSize($event) {
    if (this.sizeSelected.indexOf($event.target.id) != -1) {
      this.sizeSelected.splice(this.sizeSelected.indexOf($event.target.id), 1);
      (document.getElementById(`${$event.target.id}`) as HTMLInputElement).classList.remove('sizeSelected')
    } else {
      this.sizeSelected.push($event.target.id);
      (document.getElementById(`${$event.target.id}`) as HTMLInputElement).classList.add('sizeSelected')
    }

    //console.log(this.sizeSelected)
  }

  showFilters() {
    (document.getElementById(`filter-modal`) as HTMLInputElement).style.height = '100%'
  }

  closeFilters() {
    (document.getElementById(`filter-modal`) as HTMLInputElement).style.height = '0'
  }

  applyFilters() {
    this.closeFilters()
    console.log(`Categories: ${this.categorySelected} & Sizes: ${this.sizeSelected}`)
  }

  moreProducts() {
    this.nbPages++;
    this.search();
  }

}
