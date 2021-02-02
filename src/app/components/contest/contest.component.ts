import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { IpService } from 'src/app/services/ip.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { faFacebookF, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faLink } from '@fortawesome/free-solid-svg-icons';
import { Meta, Title } from '@angular/platform-browser';

declare const gtag: any;

@Component({
  selector: 'app-contest',
  templateUrl: './contest.component.html',
  styleUrls: ['./contest.component.scss']
})
export class ContestComponent implements OnInit {

  faFacebookF = faFacebookF
  faTwitter = faTwitter
  faEnvelope = faEnvelope
  faLink = faLink

  // boolean
  validEntry: boolean = false
  validEmail: boolean = false
  validHandle: boolean = false
  validSize: boolean = false
  entrySubmitting: boolean = false
  entrySubmitted: boolean = false
  entrySubmitError: boolean = false

  email: string
  handle: string
  size: string
  ip_address: string
  errorMessage: string

  constructor(
    private afs: AngularFirestore,
    private ipService: IpService,
    private http: HttpClient,
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platform_id: Object
  ) { }

  ngOnInit() {
    this.title.setTitle('AJ1 Dark Mocha & YZY Carbon Giveaway | NXTDROP')
    this.addMetaTags()


    this.ipService.getIPAddress().subscribe(
      (data: any) => {
        this.ip_address = data.ip
      },
      err => {
        console.error(err)
        this.ip_address = 'unknown'
      }
    )
  }

  emailChanges() {
    this.email = (document.getElementById('email') as HTMLInputElement).value
    const pattern = new RegExp(/.+@.+\.[a-zA-Z]{2,}/gm)

    if (pattern.test(this.email)) {
      this.validEmail = true
    } else {
      this.validEmail = false
    }

    this.validEmail && this.validHandle && this.validSize ? this.validEntry = true : this.validEntry = false
  }

  handleChanges() {
    this.handle = (document.getElementById('handle') as HTMLInputElement).value

    if (this.handle.length > 2) {
      this.validHandle = true
    } else {
      this.validHandle = false
    }

    this.validEmail && this.validHandle && this.validSize ? this.validEntry = true : this.validEntry = false
  }

  sizeChanges() {
    this.size = (document.getElementById('size') as HTMLInputElement).value

    if (this.size.length > 2) {
      this.validSize = true
    } else {
      this.validSize = false
    }

    this.validEmail && this.validHandle && this.validSize ? this.validEntry = true : this.validEntry = false
  }

  submitEntry() {
    const id = this.makeid(10)
    this.entrySubmitting = true

    this.afs.collection('contest').doc(id).set({
      email: this.email,
      handle: this.handle,
      size: this.size,
      created_at: Date.now(),
      ip_address: this.ip_address,
      user_agent: navigator.userAgent
    })
      .then(response => {
        this.entrySubmitting = false
        this.entrySubmitted = true

        this.http.post(`${environment.cloud.url}enterGiveaway`, {
          email: this.email
        }).subscribe()
      })
      .catch(err => {
        console.error(err)
        this.errorMessage = 'Cannot submit entry. Try again.'
        this.entrySubmitting = false
        this.entrySubmitError = true

        setTimeout(() => {
          this.entrySubmitError = false
          this.errorMessage = ''
        }, 3000);
      })
  }

  private makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  share(social: string) {
    if (isPlatformBrowser(this.platform_id)) {
      if (social === 'fb') {
        window.open(`https://www.facebook.com/sharer/sharer.php?app_id=316718239101883&u=https://nxtdrop.com/giveaway&display=popup&ref=plugin`, 'popup', 'width=600,height=600,scrollbars=no,resizable=no');
        gtag('event', 'share_giveaway_fb', {
          'event_category': 'engagement',
          'event_label': 'Jordan 1 Retro High Turbo Green'
        });
        return false;
      } else if (social === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=Win a free pair of Jordan 1 Retro High Turbo Green on @nxtdrop https://nxtdrop.com/giveaway`, 'popup', 'width=600,height=600,scrollbars=no,resizable=no');
        gtag('event', 'share_giveaway_twitter', {
          'event_category': 'engagement',
          'event_label': 'Jordan 1 Retro High Turbo Green'
        });
        return false;
      } else if (social === 'mail') {
        window.location.href = `mailto:?subject=Win a free pair of Jordan 1 Retro High Turbo Green&body=Hey, you can win free pair of Jordan 1 Retro High Turbo Green by entering this giveaway. Check it out here https://nxtdrop.com/giveaway`;
        gtag('event', 'share_giveaway_mail', {
          'event_category': 'engagement',
          'event_label': 'Jordan 1 Retro High Turbo Green'
        });
        return false;
      } else if (social === 'copy_link') {
        this.copyStringToClipboard(`https://nxtdrop.com/giveaway`);
        gtag('event', 'share_giveaway_link', {
          'event_category': 'engagement',
          'event_label': 'Jordan 1 Retro High Turbo Green'
        });
      } else {
        return false;
      }
    }
  }

  copyStringToClipboard(str: string) {
    if (isPlatformBrowser(this.platform_id)) {
      const el = document.createElement('textarea');
      el.value = str;
      el.style.visibility = 'none';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);

      document.getElementById('tooltiptext').style.visibility = 'visible';
      document.getElementById('tooltiptext').style.opacity = '1';

      setTimeout(() => {
        document.getElementById('tooltiptext').style.visibility = 'none';
        document.getElementById('tooltiptext').style.opacity = '0';
      }, 3000);
    }
  }

  addMetaTags() {
    this.meta.addTags([
      { name: `title`, content: `AJ1 Dark Mocha & YZY Carbon Giveaway | NXTDROP` },
      { name: `description`, content: 'Win a free pair of Air Jordan 1 Retro High OG Dark Mocha and Yeezy Boost 350 V2 Carbon on NXTDROP.' },
      { name: `keywords`, content: 'nxtdrop, next drop, stockx canada, goat canada, consignment canada, sneakers canada, deadstock, jordans, yeezys, adidas' },
      { property: `og:title`, content: `AJ1 Dark Mocha & YZY Carbon Giveaway | NXTDROP` },
      { property: `og:url`, content: 'https://nxtdrop.com/' },
      { property: `og:image`, content: 'https://firebasestorage.googleapis.com/v0/b/nxtdrop.appspot.com/o/CarouselDuplicata3.png?alt=media&token=4b96304e-b8c9-4761-8154-bdf27591c4c5' },
      { property: `og:description`, content: 'Win a free pair of Air Jordan 1 Retro High OG Dark Mocha and Yeezy Boost 350 V2 Carbon on NXTDROP.' },
      { property: `twitter:title`, content: `AJ1 Dark Mocha & YZY Carbon Giveaway | NXTDROP` },
      { property: `twitter:card`, content: 'summary_large_image' },
      { property: `twitter:image`, content: 'https://firebasestorage.googleapis.com/v0/b/nxtdrop.appspot.com/o/CarouselDuplicata3.png?alt=media&token=4b96304e-b8c9-4761-8154-bdf27591c4c5' },
      { property: `twitter:description`, content: 'Win a free pair of Air Jordan 1 Retro High OG Dark Mocha and Yeezy Boost 350 V2 Carbon on NXTDROP.' }
    ], true);
  }

}
