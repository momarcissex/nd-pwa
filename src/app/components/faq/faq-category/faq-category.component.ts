import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-faq-category',
  templateUrl: './faq-category.component.html',
  styleUrls: ['./faq-category.component.scss']
})
export class FaqCategoryComponent implements OnInit {

  faCircleNotch = faCircleNotch

  category: string = '';
  posts = [];
  isLimit: boolean = false;
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private title: Title,
    private seo: MetaService
  ) { }

  ngOnInit() {
    this.category = this.route.snapshot.params.category;
    this.title.setTitle(`${this.category.toUpperCase()} - FAQ | NXTDROP`)
    this.seo.addTags(`${this.category.toUpperCase()} - FAQ`)


    this.afs.collection(`faq`).ref.where(`categories.${this.category}`, '==', true).orderBy('Q', 'asc').limit(10).get().then(res => {
      res.docs.forEach(ele => {
        this.posts.push(ele.data());
      })
    });
  }

  loadMore() {
    this.loading = true;
    this.afs.collection(`faq`).ref.where(`categories.${this.category}`, '==', true).limit(10).orderBy('Q', 'asc').startAfter(this.posts[this.posts.length - 1].Q).get().then(res => {
      res.docs.forEach(ele => {
        this.posts.push(ele.data());

        if (res.docs.length < 10) {
          this.isLimit = true
        }

        this.loading = false;
      })
    })
  }

}
