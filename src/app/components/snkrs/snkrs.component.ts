import { Component, OnInit, OnDestroy } from '@angular/core';
import { SnkrsService } from 'src/app/services/snkrs.service';
import { AuthService } from 'src/app/services/auth.service';
import { isNullOrUndefined, isUndefined } from 'util';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { faAsterisk, faCircleNotch, faMedal } from '@fortawesome/free-solid-svg-icons';

class Question {
  answers: Array<any>;
  assetURL: string;
  correctAnswer: string;
}

@Component({
  selector: 'app-snkrs',
  templateUrl: './snkrs.component.html',
  styleUrls: ['./snkrs.component.scss']
})
export class SnkrsComponent implements OnInit, OnDestroy {

  faMedal = faMedal
  faAsterisk = faAsterisk
  faCircleNotch = faCircleNotch

  UID: string;
  username: string;
  userEmail: string;
  gameID: string;
  qID: string;

  countdown = 10;
  pageCountdown = 3;

  countdownDisplay: number;
  countdownInterval: NodeJS.Timer;
  animationInterval: NodeJS.Timer;

  // Pages boolean
  howItWorksPage = true;
  countdownPage = false;
  resultPage = false;
  totalPage = false;
  questionPage = false;
  invitationLoading = false;
  invitationSent = false;
  invitationError = false;
  validEmail = false;
  hasExtra = false;
  gameUnavailable = true;
  nextTourCountdown = true;

  // Game Variables
  questions = [];
  currentQuestion: Question;
  numQuestion: number;
  numQuestionAnswered = 0;
  resultInfo = {
    correctAnswer: '',
    userAnswer: '',
    points: 0
  }

  countdownName: string;

  // Game Stats
  totalPoints: number;
  numCorrectAnswer = 0;
  numWrongAnswer = 0;
  rank: number;

  leaderboard = [];

  timestamp = Date.now();

  nextGameCountdown: string = `00:00:00`;

  constructor(
    private snkrsService: SnkrsService,
    private auth: AuthService,
    private router: Router,
    private title: Title,
    private meta: Meta
  ) { }

  ngOnInit() {
    this.init();

    this.title.setTitle('Name The SNKRS | NXTDROP: Buy and Sell Sneakers in Canada');
    this.meta.addTags([
      { name: `title`, content: `Name The SNKRS | NXTDROP: Easiest & Safest Way To Buy and Sell Authentic Sneakers in Canada` },
      { name: `description`, content: 'Play Name The SNKRS and win up to CA$200 in store credit. Canada\'s only online sneaker marketplace. The easiest and safest way to buy and sell Jordan, Yeezy, Nike, adidas and all the hottest sneakers in Canada. All sneakers are 100% verified authentic and no duty fees. We take care of everything while you happily wait to receive your kicks or get paid.' },
      { name: `keywords`, content: 'stockx canada, goat canada, consignment canada, sneakers canada, deadstock, jordans, yeezys, adidas, nxtdrop, next drop' },
      { name: `og:title`, content: `Name The SNKRS | NXTDROP: Easiest & Safest Way To Buy and Sell Authentic Sneakers in Canada` },
      { name: `og:url`, content: 'https://nxtdrop.com/' },
      { name: `og:image`, content: 'https://firebasestorage.googleapis.com/v0/b/nxtdrop.appspot.com/o/CarouselDuplicata3.png?alt=media&token=4b96304e-b8c9-4761-8154-bdf27591c4c5' },
      { name: `og:description`, content: 'Play Name The SNKRS and win up to CA$200 in store credit. Play Name The SNKRS and win up to CA$200 in store credit.Canada\'s only online sneaker marketplace. The easiest and safest way to buy and sell Jordan, Yeezy, Nike, adidas and all the hottest sneakers in Canada. All sneakers are 100% verified authentic and no duty fees. We take care of everything while you happily wait to receive your kicks or get paid.' },
      { name: `twitter:title`, content: `Name The SNKRS | NXTDROP: Easiest & Safest Way To Buy and Sell Authentic Sneakers in Canada` },
      { name: `twitter:card`, content: 'summary_large_image' },
      { name: `twitter:image`, content: 'https://firebasestorage.googleapis.com/v0/b/nxtdrop.appspot.com/o/CarouselDuplicata3.png?alt=media&token=4b96304e-b8c9-4761-8154-bdf27591c4c5' },
      { name: `twitter:description`, content: 'Play Name The SNKRS and win up to CA$200 in store credit. Canada\'s only online sneaker marketplace. The easiest and safest way to buy and sell Jordan, Yeezy, Nike, adidas and all the hottest sneakers in Canada. All sneakers are 100% verified authentic and no duty fees. We take care of everything while you happily wait to receive your kicks or get paid.' }
    ], true);
  }

  init() {
    this.snkrsService.getGameID(this.timestamp).then(response => {
      // console.log(response);
      if (response) {
        if (this.timestamp > response[2]) {
          this.gameUnavailable = false;
          this.gameID = response[0];
          this.qID = response[1];
          this.getLeaderboard();

          if (this.qID === '') {
            this.gameUnavailable = true;
            this.getNextTournament();
          } else if (typeof this.qID === 'number') {
            this.gameUnavailable = true;
            this.quizCountdown(this.qID);
            this.countdownName = 'round';
          }
        } else {
          this.countdownName = 'tournament';
          this.quizCountdown(response[2]);
        }

        this.auth.isConnected().then(res => {
          if (!isNullOrUndefined(res)) {
            this.UID = res.uid;
            this.userEmail = res.email;

            this.snkrsService.getUsername(this.UID, this.gameID).subscribe((response: any) => {
              if (!isNullOrUndefined(response)) {
                this.username = response.username;
                this.hasExtra = response.invitationExtra;
              }
            });
            //console.log(this.UID);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    //console.log('work');
    clearTimeout(this.countdownInterval);
    clearTimeout(this.animationInterval);
  }

  startCountdown(seconds: number, int: number) {
    this.countdownDisplay = seconds;

    this.countdownInterval = setInterval(() => {
      this.countdownDisplay--;
      this.countdownBorderAnimation(this.countdownDisplay, int);

      if (this.countdownDisplay <= 0) {
        clearTimeout(this.countdownInterval);

        if (this.questionPage) {
          this.numQuestionAnswered++;
          this.goToResult();
          this.nextQuestion();
        }
      }
    }, int);
  }

  countdownBorderAnimation(countdown: number, int: number) {
    let color: string;
    let animation = 0;

    if (countdown > 5) {
      color = "#98fb98";
    } else if (countdown <= 5 && countdown > 2) {
      color = "#f1f51b";
    } else if (countdown <= 2 && countdown > 1) {
      color = "#f79e1b";
    } else if (countdown <= 1 && countdown > 0) {
      color = "#f55c1b";
    } else {
      color = "#f51b1b";
    }

    this.animationInterval = setInterval(() => {
      if (animation === 0) {
        document.getElementById('countdown').style.borderTopColor = color;
        animation++;
      } else if (animation === 1) {
        document.getElementById('countdown').style.borderRightColor = color;
        animation++;
      } else if (animation === 2) {
        document.getElementById('countdown').style.borderBottomColor = color;
        animation++;
      } else {
        document.getElementById('countdown').style.borderLeftColor = color;
        clearTimeout(this.animationInterval);

        setTimeout(() => {
          document.getElementById('countdown').style.borderLeftColor = "#222021";
          document.getElementById('countdown').style.borderBottomColor = "#222021";
          document.getElementById('countdown').style.borderRightColor = "#222021";
          document.getElementById('countdown').style.borderTopColor = "#222021";
        }, int * 0.15);
      }
    }, int * 0.20);
  }

  goToQuestion() {
    setTimeout(() => {
      this.howItWorksPage = false;
      this.countdownPage = false;
      this.resultPage = false;
      this.totalPage = false;
      this.questionPage = true;

      this.snkrsService.questionViewed(this.currentQuestion, this.gameID, this.qID, this.UID);

      setTimeout(() => {
        this.startCountdown(this.countdown, 1000);
      }, 1000);

    }, 500);
  }

  goToCountdown() {
    //console.log(this.numQuestion);
    //console.log(this.numQuestionAnswered);
    if (this.numQuestionAnswered < this.numQuestion) {
      setTimeout(() => {
        this.howItWorksPage = false;
        this.countdownPage = true;
        this.resultPage = false;
        this.totalPage = false;
        this.questionPage = false;

        setTimeout(() => {
          this.startCountdown(this.pageCountdown, 2000);

          setTimeout(() => {
            this.goToQuestion();
          }, 8000);
        }, 500);

      }, 500);
    } else {
      this.gameStats();
      this.goToFinalPage();
    }
  }

  goToResult() {
    this.cleanResultInfo();
    clearTimeout(this.countdownInterval);
    clearTimeout(this.animationInterval);
    setTimeout(() => {
      this.howItWorksPage = false;
      this.countdownPage = false;
      this.resultPage = true;
      this.totalPage = false;
      this.questionPage = false;
      clearTimeout();
    }, 500);
  }

  selectAnswer($event) {
    const answerPicked = $event.target.innerHTML;
    this.goToResult();

    if (this.currentQuestion.correctAnswer === answerPicked) {
      this.resultInfo.correctAnswer = this.currentQuestion.correctAnswer;
      this.resultInfo.points = 10;
      this.resultInfo.userAnswer = answerPicked;
    } else {
      this.resultInfo.correctAnswer = this.currentQuestion.correctAnswer;
      this.resultInfo.points = -2;
      this.resultInfo.userAnswer = answerPicked;
    }

    this.snkrsService.addUserAnswer(this.resultInfo, this.UID, this.gameID, this.qID).then(res => {
      if (res) {
        this.numQuestionAnswered++;
        this.nextQuestion();
      } else {
        //this.router.navigate(['..']);
      }
    })
  }

  cleanResultInfo() {
    this.resultInfo.correctAnswer = this.currentQuestion.correctAnswer;
    this.resultInfo.points = -2;
    this.resultInfo.userAnswer = '';
  }

  nextQuestion() {
    this.currentQuestion = this.questions[this.numQuestionAnswered];
    this.getLeaderboard();
  }

  getQuestions() {
    this.snkrsService.getQuestions(this.gameID, this.qID).then(res => {
      this.questions = res.data().Q;
      this.numQuestion = res.data().numQ;
      this.currentQuestion = this.questions[this.numQuestionAnswered];
      this.goToCountdown();
      //console.log(res.data());
    });
  }

  startGame() {
    if (isNullOrUndefined(this.UID)) {
      this.router.navigate(['/login'], {
        queryParams: { redirectTo: '/contest' }
      });
    } else {
      this.snkrsService.startGame(this.UID, this.gameID, this.qID).then(res => {
        //console.log(res);
        if (typeof res === "boolean") {
          this.router.navigate(['..']);
        } else {
          this.numQuestionAnswered = res;
          this.getQuestions();
        }
      });
    }
  }

  goToFinalPage() {
    setTimeout(() => {
      this.howItWorksPage = false;
      this.countdownPage = false;
      this.resultPage = false;
      this.totalPage = true;
      this.questionPage = false;

      setTimeout(() => {
        this.disableInvite();
      }, 500);
    }, 250);
  }

  gameStats() {
    this.snkrsService.getGameStats(this.gameID, this.qID, this.UID).then(data => {
      this.numCorrectAnswer = 0;
      this.numWrongAnswer = 0;

      data.data().answers.forEach(element => {
        if (element.correctAnswer === element.userAnswer) {
          this.numCorrectAnswer++;
        } else {
          this.numWrongAnswer++;
        }
      });
    });

    this.snkrsService.getPoints(this.gameID, this.UID).subscribe((data: any) => {
      this.totalPoints = data.points;
    })

    this.snkrsService.getRank(this.gameID, this.UID).then(data => {
      //console.log(data.docs.length);
      this.rank = data.docs.length;
    });
  }

  getLeaderboard() {
    this.snkrsService.getLeaderboard(this.gameID).then(res => {
      let i = 0;
      let board = [];
      res.docs.forEach(doc => {
        i++;
        const data = {
          username: doc.data().username,
          points: doc.data().points,
          rank: i
        }
        board.push(data);
      });

      this.leaderboard = Object.assign([], board);
      board.length = 0;
    })
  }

  sendInvite() {
    const email = (document.getElementById('email') as HTMLInputElement).value;

    if (email !== this.userEmail && !isNullOrUndefined(email) && email !== '') {
      this.invitationLoading = true;
      this.snkrsService.addEmail(email, this.gameID, this.UID, this.username).then(res => {
        this.invitationLoading = false;
        if (res) {
          this.invitationSent = true;
          this.gameStats();
          this.getLeaderboard();
        } else {
          this.invitationError = true;
        }

        this.disableInvite();

        setTimeout(() => {
          this.invitationError = false;
          this.invitationSent = false;
          this.validEmail = false;
        }, 2000)
      });
    } else {
      this.invitationError = true;

      setTimeout(() => {
        this.invitationError = false;
      }, 2000);
    }
  }

  emailChanges($event) {
    const email = $event.target.value;
    const pattern = new RegExp(/^.+@.+\.[a-zA-Z]{2,}$/gm);

    if (pattern.test(email)) {
      this.validEmail = true;
    } else {
      this.validEmail = false;
    }
  }

  disableInvite() {
    if (this.hasExtra) {
      (document.getElementById('email') as HTMLInputElement).disabled = true;
    }
  }

  quizCountdown(countdownDate: number) {
    let int: NodeJS.Timer;

    int = setInterval(() => {
      const distance = countdownDate - Date.now();

      let h = Math.floor(distance / (1000 * 60 * 60));
      let m = Math.floor(distance / (1000 * 60) % 60);
      let s = Math.floor(distance / 1000) % 60;

      let hours: any;
      let minutes: any;
      let seconds: any;

      if (h < 10) {
        hours = `0${h}`;
      } else {
        hours = h;
      }

      if (m < 10) {
        minutes = `0${m}`;
      } else {
        minutes = m;
      }

      if (s < 10) {
        seconds = `0${s}`;
      } else {
        seconds = s;
      }

      this.nextGameCountdown = `${hours}:${minutes}:${seconds}`;

      //console.log(distance);

      if (distance <= 0) {
        //console.log('work');
        clearTimeout(int);
        this.timestamp = Date.now();
        this.init();
      }
    }, 1000);
  }

  getNextTournament() {
    this.snkrsService.getNextTournament(this.timestamp).then(response => {
      if (!isUndefined(response.docs[0])) {
        this.quizCountdown(response.docs[0].data().openingDate);
      } else {
        this.nextTourCountdown = false;
      }
    });
  }
}
