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
    if (product === undefined) {
      this.meta.addTags([
        { name: `title`, content: `${pageTitle} | NXTDROP: Buy and Sell Sneakers in Canada` },
        { name: `description`, content: 'Buy and sell sneakers online in Canada. NXTDROP is 100% Canadian-based so you never have to worry about duty and all the items are 100% verified authentic or you get a 100% refund. Buy and sell the latest Nike, adidas, Jordan and the hottest sneakers in the market.' },
        { name: `keywords`, content: 'nxtdrop, next drop, buy, sell, sneakers, adidas yeezy, retro jordans, canada' },
        { property: `og:title`, content: `${pageTitle} | NXTDROP: Buy and Sell Sneakers in Canada` },
        { property: `og:url`, content: 'https://nxtdrop.com/' },
        { property: `og:image`, content: 'https://firebasestorage.googleapis.com/v0/b/nxtdrop.appspot.com/o/CarouselDuplicata3.png?alt=media&token=4b96304e-b8c9-4761-8154-bdf27591c4c5' },
        { property: `og:description`, content: 'Buy and sell sneakers online in Canada. NXTDROP is 100% Canadian-based so you never have to worry about duty and all the items are 100% verified authentic or you get a 100% refund. Buy and sell the latest Nike, adidas, Jordan and the hottest sneakers in the market.' },
        { property: `twitter:title`, content: `${pageTitle} | NXTDROP: Buy and Sell Sneakers in Canada` },
        { property: `twitter:card`, content: 'summary_large_image' },
        { property: `twitter:image`, content: 'https://firebasestorage.googleapis.com/v0/b/nxtdrop.appspot.com/o/CarouselDuplicata3.png?alt=media&token=4b96304e-b8c9-4761-8154-bdf27591c4c5' },
        { property: `twitter:description`, content: 'Buy and sell sneakers online in Canada. NXTDROP is 100% Canadian-based so you never have to worry about duty and all the items are 100% verified authentic or you get a 100% refund. Buy and sell the latest Nike, adidas, Jordan and the hottest sneakers in the market.' }
      ], true);
    } else {
      this.meta.addTags([
        { name: 'title', content: `${product.model} | NXTDROP` },
        { name: 'description', content: `Buy and sell authentic ${product.model} and other ${product.brand} sneakers in Canada. No duty fees and all the items are 100% verified authentic or you get 100% refund.` },
        { name: 'keywords', content: `nxtdrop, next drop, buy, sell, sneakers, adidas yeezy, retro jordans, canada, ${product.model}, ${product.brand}, colorway ${product.colorway}, sneakers` },
        { property: 'og:title', content: `${product.model}` },
        { property: 'og:url', content: `https://nxtdropcom/product/${product.productID}` },
        { property: 'og:image', content: `${product.assetURL}` },
        { property: 'og:description', content: `Buy and sell authentic ${product.model} and other ${product.brand} sneakers in Canada. No duty fees and all the items are 100% verified authentic or you get 100% refund.` },
        { property: 'og:locale', content: `en_CA` },
        { property: 'twitter:title', content: `${product.model} | NXTDROP` },
        { property: 'twitter:card', content: 'summary_large_image' },
        { property: 'twitter:image', content: `${product.assetURL}` },
        { property: 'twitter:description', content: `Buy and sell authentic ${product.model} and other ${product.brand} sneakers in Canada. No duty fees and all the items are 100% verified authentic or you get 100% refund.` },
        { property: 'product:brand', content: `${product.brand}` },
        { property: 'product:condition', content: 'new' },
        { property: 'product:price:currency', content: 'CAD' },
        { property: 'og:price:currency', content: 'CAD' },
        { property: 'product:retailer_item_id', content: `${product.productID}` },
        { property: 'product:catalog_id', content: `${product.productID}` },
        { property: 'product:category', content: `187` },
        { property: 'product:locale', content: `en_CA` },
      ], true);

      if (!(product.lowest_price == null || product.lowest_price == undefined)) {
        this.meta.addTags([
          { property: 'og:price:amount', content: `${product.lowest_price}.00` },
          { property: 'product:price:amount', content: `${product.lowest_price}.00` },
          { property: 'product:availability', content: 'in stock' }
        ])
      } else {
        this.meta.addTags([
          { property: 'og:price:amount', content: `0.00` },
          { property: 'product:price:amount', content: `0.00` },
          { property: 'product:availability', content: 'out of stock' }
        ])
      }
    }
  }

  removeTags() {
    this.meta.removeTag("name='title'")
    this.meta.removeTag("name='description'")
    this.meta.removeTag("name='keywords'")
    this.meta.removeTag("property='og:title'")
    this.meta.removeTag("property='og:url'")
    this.meta.removeTag("property='og:image'")
    this.meta.removeTag("property='og:description'")
    this.meta.removeTag("property='twitter:title'")
    this.meta.removeTag("property='twitter:card'")
    this.meta.removeTag("property='twitter:image'")
    this.meta.removeTag("property='twitter:description'")
    this.meta.removeTag("property='product:brand'")
    this.meta.removeTag("property='product:condition'")
    this.meta.removeTag("property='product:item_group_id'")
    this.meta.removeTag("property='product:price:currency'")
    this.meta.removeTag("property='og:price:currency'")
    this.meta.removeTag("property='product:retailer_item_id'")
    this.meta.removeTag("property='product:catalog_id'")
    this.meta.removeTag("property='product:category'")
    this.meta.removeTag("property='og:pric:amount'")
    this.meta.removeTag("property='product:price:amount'")
    this.meta.removeTag("property='product:availability'")
  }

  createCanonicalLink() {
    let link: HTMLLinkElement = this.dom.createElement('link');
    link.setAttribute('rel', 'canonical');
    this.dom.head.appendChild(link);
    link.setAttribute('href', `https://nxtdrop.com/${this.router.url}`);
  }
}
