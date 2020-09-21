import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as algoliasearch from 'algoliasearch';
import { environment } from 'src/environments/environment';
import { Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { MetaService } from 'src/app/services/meta.service';
import { isNullOrUndefined } from 'util';

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

  categorySelected: string
  sizeSelected: string

  typingTimer;
  doneTypingInterval = 1000;

  filters: string = ''

  sizeSuffix = {
    "W": 'W',
    "M": "",
    "GS": "Y",
    "undefined": ""
  }

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

    const q = (document.getElementById('search-input') as HTMLInputElement).value;
    this.filters = ''

    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      const query: any = {
        q
      }

      console.log(this.categorySelected)
      console.log(this.sizeSelected)

      if (!isNullOrUndefined(this.categorySelected) || !isNullOrUndefined(this.sizeSelected)) {
        if (!isNullOrUndefined(this.categorySelected)) query.category = this.categorySelected
        if (!isNullOrUndefined(this.sizeSelected)) query.size = this.sizeSelected

        this.buildFilter()
      }

      console.log(query)

      this.router.navigate([],
        {
          queryParams: query
        });

      console.log(this.filters)

      this.index.search({
        query: q,
        filters: this.filters,
        attributesToRetrieve: ['assetURL', 'model', 'productID', 'lowestPrice', 'sizes_lowest_ask'],
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
          search_string: `${q}`
        })
      });
    }, this.doneTypingInterval);
  }

  selectCategory($event) {
    const categories = {
      "women": 'W',
      "men": "M",
      "youth": "GS"
    }

    let category = categories[$event.target.id]


    if (isNullOrUndefined(this.categorySelected)) {
      (document.getElementById(`${$event.target.id}`) as HTMLInputElement).classList.add('categorySelected')
      this.categorySelected = category
    } else {
      if (Object.keys(categories).find(key => categories[key] === this.categorySelected) === $event.target.id) {
        (document.getElementById(`${Object.keys(categories).find(key => categories[key] === this.categorySelected)}`) as HTMLInputElement).classList.remove('categorySelected')

        this.categorySelected = undefined
      } else {
        (document.getElementById(`${Object.keys(categories).find(key => categories[key] === this.categorySelected)}`) as HTMLInputElement).classList.remove('categorySelected');
        (document.getElementById(`${$event.target.id}`) as HTMLInputElement).classList.add('categorySelected')

        this.categorySelected = category
      }
    }
    //console.log(this.categorySelected)
  }

  selectSize($event) {
    if (isNullOrUndefined(this.sizeSelected)) {
      (document.getElementById(`${$event.target.id}`) as HTMLInputElement).classList.add('sizeSelected')
      this.sizeSelected = $event.target.id
    } else {
      if (this.sizeSelected === $event.target.id) {
        (document.getElementById(`${this.sizeSelected}`) as HTMLInputElement).classList.remove('sizeSelected')

        this.sizeSelected = undefined
      } else {
        (document.getElementById(`${this.sizeSelected}`) as HTMLInputElement).classList.remove('sizeSelected');
        (document.getElementById(`${$event.target.id}`) as HTMLInputElement).classList.add('sizeSelected')

        this.sizeSelected = $event.target.id
      }
    }

    console.log(this.sizeSelected)

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
    this.search()
    //console.log(`Categories: ${this.categorySelected} & Sizes: ${this.sizeSelected}`)
  }

  buildFilter() {
    if (!isNullOrUndefined(this.categorySelected)) this.filters = `size_category:${this.categorySelected}`

    if (!isNullOrUndefined(this.sizeSelected) && this.filters != '') this.filters += ` AND sizes_available:US${this.sizeSelected}${this.sizeSuffix[this.categorySelected]}`
    if (!isNullOrUndefined(this.sizeSelected) && this.filters == '') this.filters = `sizes_available:US${this.sizeSelected}${this.sizeSuffix[this.categorySelected]}`
  }

  getLowestPrice(prices, lowestPrice) {
    let price

    if (!isNullOrUndefined(this.sizeSelected)) {
      if (isNullOrUndefined(prices)) price = lowestPrice
      else price = prices[`US${this.sizeSelected}${this.sizeSuffix[this.categorySelected]}`]
    } else {
      price = lowestPrice
    }

    return price
  }

  moreProducts() {
    this.nbPages++;
    this.search();
  }

}
