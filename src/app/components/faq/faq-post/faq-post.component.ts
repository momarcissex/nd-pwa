import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { Title, Meta } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';

@Component({
  selector: 'app-faq-post',
  templateUrl: './faq-post.component.html',
  styleUrls: ['./faq-post.component.scss']
})
export class FaqPostComponent implements OnInit {

  category: string = '';
  post: string = '';

  content: any = {
    Q: '',
    A: '',
  }

  constructor(
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private title: Title,
    private meta: Meta
  ) { }

  async ngOnInit() {
    this.category = this.route.snapshot.params.category;
    this.post = this.route.snapshot.params.post;

    await this.afs.collection(`faq`).doc(`${this.post}`).valueChanges().subscribe(res => {
      this.content = res;
      this.title.setTitle(`${this.content.Q} - FAQ | NXTDROP`)
      this.meta.addTags([
        { name: `title`, content: `${this.content.Q} - FAQ | NXTDROP` },
        { name: `description`, content: `${this.content.Q} ${this.content.A}` },
        { name: `keywords`, content: `nxtdrop, next drop, consignment canada, sneakers canada, deadstock, jordans, yeezys, adidas, ${this.category}, faq` },
        { property: `og:title`, content: `${this.content.Q} - FAQ | NXTDROP` },
        { property: `og:url`, content: `https://nxtdrop.com/faq/${this.category}/${this.post}` },
        { property: `og:image`, content: 'https://firebasestorage.googleapis.com/v0/b/nxtdrop.appspot.com/o/CarouselDuplicata3.png?alt=media&token=4b96304e-b8c9-4761-8154-bdf27591c4c5' },
        { property: `og:description`, content: `${this.content.Q} ${this.content.A}` },
        { property: `twitter:title`, content: `${this.content.Q} - FAQ | NXTDROP` },
        { property: `twitter:card`, content: 'summary_large_image' },
        { property: `twitter:image`, content: 'https://firebasestorage.googleapis.com/v0/b/nxtdrop.appspot.com/o/CarouselDuplicata3.png?alt=media&token=4b96304e-b8c9-4761-8154-bdf27591c4c5' },
        { property: `twitter:description`, content: `${this.content.Q} ${this.content.A}` }
      ], true);
    });
  }

}
