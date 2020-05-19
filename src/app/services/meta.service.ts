import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Product } from '../models/product';
import { isNullOrUndefined } from 'util';

@Injectable({
  providedIn: 'root'
})
export class MetaService {

  constructor(
    private meta: Meta,
    @Inject(DOCUMENT) private dom,
    private router: Router
  ) { }

  addTags(pageTitle: string, product?: Product) {
    console.log('before tags')
    if (product === undefined) {
      this.meta.addTags([
        { name: `title`, content: `${pageTitle} | NXTDROP: No Fakes, No Duties` },
        { name: `description`, content: 'Buy and sell sneakers online in Canada. NXTDROP is 100% Canadian-based so you never have to worry about duty and all the items are 100% verified authentic or you get a 100% refund. Buy and sell the latest Nike, adidas, Jordan and the hottest sneakers in the market.' },
        { name: `keywords`, content: 'nxtdrop, next drop, stockx canada, goat canada, consignment canada, sneakers canada, deadstock, jordans, yeezys, adidas' },
        { property: `og:title`, content: `${pageTitle} | NXTDROP: No Fakes, No Duties` },
        { property: `og:url`, content: 'https://nxtdrop.com/' },
        { property: `og:image`, content: 'https://firebasestorage.googleapis.com/v0/b/nxtdrop.appspot.com/o/CarouselDuplicata3.png?alt=media&token=4b96304e-b8c9-4761-8154-bdf27591c4c5' },
        { property: `og:description`, content: 'Buy and sell sneakers online in Canada. NXTDROP is 100% Canadian-based so you never have to worry about duty and all the items are 100% verified authentic or you get a 100% refund. Buy and sell the latest Nike, adidas, Jordan and the hottest sneakers in the market.' },
        { property: `twitter:title`, content: `${pageTitle} | NXTDROP: No Fakes, No Duties` },
        { property: `twitter:card`, content: 'summary_large_image' },
        { property: `twitter:image`, content: 'https://firebasestorage.googleapis.com/v0/b/nxtdrop.appspot.com/o/CarouselDuplicata3.png?alt=media&token=4b96304e-b8c9-4761-8154-bdf27591c4c5' },
        { property: `twitter:description`, content: 'Buy and sell sneakers online in Canada. NXTDROP is 100% Canadian-based so you never have to worry about duty and all the items are 100% verified authentic or you get a 100% refund. Buy and sell the latest Nike, adidas, Jordan and the hottest sneakers in the market.' }
      ], true);
    } else {
      this.meta.addTags([
        { name: 'title', content: `${product.model} | NXTDROP` },
        { name: 'description', content: `Buy and sell authentic ${product.model} and other ${product.brand} sneakers in Canada. No duty fees and all the items are 100% verified authentic or you get 100% refund.` },
        { name: 'keywords', content: `${product.model}, ${product.brand}, colorway ${product.colorway}, sneakers canada` },
        { property: 'og:title', content: `${product.model} | NXTDROP` },
        { property: 'og:url', content: `https://nxtdropcom/product/${product.productID}` },
        { property: 'og:image', content: `${product.assetURL}` },
        { property: 'og:description', content: `Buy and sell authentic ${product.model} and other ${product.brand} sneakers in Canada. No duty fees and all the items are 100% verified authentic or you get 100% refund.` },
        { property: 'twitter:title', content: `${product.model} | NXTDROP` },
        { property: 'twitter:card', content: 'summary_large_image' },
        { property: 'twitter:image', content: `${product.assetURL}` },
        { property: 'twitter:description', content: `Buy and sell authentic ${product.model} and other ${product.brand} sneakers in Canada. No duty fees and all the items are 100% verified authentic or you get 100% refund.` }
      ], true);

      if (!isNullOrUndefined(product.lowestPrice)) {
        this.meta.addTags([
          { property: 'product:brand', content: `${product.brand}` },
          { property: 'product:availability', content: 'in stock' },
          { property: 'product:condition', content: 'new' },
          { property: 'product:price:amount', content: `${product.lowestPrice}` },
          { property: 'product:price:currency', content: 'CAD' },
          { property: 'product:retailer_item_id', content: `${product.productID}` },
          { property: 'product:item_group_id', content: `${product.type}` }
        ])
      }
    }

    console.log('after tags')
  }

  createCanonicalLink() {
    let link: HTMLLinkElement = this.dom.createElement('link');
    link.setAttribute('rel', 'canonical');
    this.dom.head.appendChild(link);
    link.setAttribute('href', `https://nxtdrop.com/${this.router.url}`);
  }
}
