import { Component, OnInit } from '@angular/core';
import { NewsService } from 'src/app/services/news.service';
import { MetaService } from 'src/app/services/meta.service';
import { Title } from '@angular/platform-browser';
import { faClock } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-blog-home',
  templateUrl: './blog-home.component.html',
  styleUrls: ['./blog-home.component.scss']
})
export class BlogHomeComponent implements OnInit {

  faClock = faClock

  posts = [];

  constructor(
    private news: NewsService,
    private meta: MetaService,
    private title: Title
  ) { }

  ngOnInit() {
    this.title.setTitle(`News | NXTDROP: Buy and Sell Authentic Sneakers - Sneaker and Fashion News`)
    this.meta.addTags('News');

    this.news.getAllNews().subscribe((json: any) => {
      json.forEach(element => {
        let post: any = {
          title: element.title.rendered,
          date: this.news.dateFormat(element.date_gmt),
          id: element.id,
          slug: element.slug
        }

        this.news.getFeaturedMedia(element._links["wp:featuredmedia"][0]["href"].replace('35.224.86.123', 'news.nxtdrop.com')).subscribe((response: any) => {
          post.img = response.source_url.replace('35.224.86.123', 'news.nxtdrop.com');
          post.alt_text = response.alt_text;
        });

        this.news.getCategory(element._links["wp:term"][0]["href"].replace('35.224.86.123', 'news.nxtdrop.com')).subscribe((response: any) => {
          post.category = response[0].name;
        });

        this.posts.push(post);
      });
    });
  }

}
