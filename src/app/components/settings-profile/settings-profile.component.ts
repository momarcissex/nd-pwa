import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/user';
import { Title } from '@angular/platform-browser';
import { MetaService } from 'src/app/services/meta.service';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { isNullOrUndefined } from 'util';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings-profile',
  templateUrl: './settings-profile.component.html',
  styleUrls: ['./settings-profile.component.scss']
})
export class SettingsProfileComponent implements OnInit {

  user: User;
  firstName: string
  lastName: string
  username: string
  email: string
  dob

  firstNameChanged = false;
  lastNameChanged = false;
  usernameChanged = false;
  dobChanged = false;
  error = false;
  loading = false;
  updated = false;

  constructor(
    private title: Title,
    private meta: MetaService,
    private userService: UserService,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.title.setTitle(`Edit Profile | NXTDROP: Sell and Buy Sneakers in Canada`);
    this.meta.addTags('Edit Profile');

    this.auth.isConnected().then(res => {
      if (isNullOrUndefined(res)) {
        this.router.navigate(['/login'], {
          queryParams: { redirectURI: 'settings/profile' }
        })
      } else {
        this.userService.getUserInfo(res.uid).subscribe(data => {
          this.user = data
          this.firstName = this.user.firstName
          this.lastName = this.user.lastName
          this.username = this.user.username
          this.dob = this.user.dob
          this.email = this.user.email
          this.getDate(this.user.dob)
        })
      }
    })
  }

  getDate(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const day = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'];
    // console.log(date.getFullYear() + '-' + months[date.getMonth()] + '-' + day[date.getUTCDate()]);
    this.dob = date.getFullYear() + '-' + months[date.getMonth()] + '-' + day[date.getUTCDate()];
  }

  firstNameChanges($event) {
    const val = $event.target.value;
    if (val.toLowerCase() != this.firstName.toLowerCase()) {
      this.firstNameChanged = true;
    } else {
      this.firstNameChanged = false;
    }
  }

  lastNameChanges($event) {
    const val = $event.target.value;
    if (val.toLowerCase() != this.lastName.toLowerCase()) {
      this.lastNameChanged = true;
    } else {
      this.lastNameChanged = false;
    }
  }

  usernameChanges($event) {
    const val = $event.target.value;
    if (val.toLowerCase() != this.username.toLowerCase()) {
      this.usernameChanged = true;
    } else {
      this.usernameChanged = false;
    }
  }

  dobChanges($event) {
    const val = $event.target.value;
    if (val != this.dob) {
      this.dobChanged = true;
    } else {
      this.dobChanged = false;
    }
  }

  updateProfile() {
    // console.log('updatedProfile called');

    if (!this.firstNameChanged && !this.lastNameChanged && !this.usernameChanged && !this.dobChanged) {
      return;
    }

    this.loading = true;
    const curFn = (document.getElementById('firstName') as HTMLInputElement).value;
    const curLn = (document.getElementById('lastName') as HTMLInputElement).value;
    const curUn = (document.getElementById('username') as HTMLInputElement).value;
    const curDOB = (document.getElementById('dob') as HTMLInputElement).value;

    // console.log(`Fn: ${this.nameReformat(curFn)}, Ln: ${this.nameReformat(curLn)}, Un: ${curUn.toLowerCase()}, dob: ${curDOB}`);

    this.userService.updateUserProfile(this.user.uid, this.nameReformat(curFn), this.nameReformat(curLn), curUn, curDOB, this.email).then(res => {
      if (res) {
        this.loading = false;
        this.updated = true;
        this.firstNameChanged = false;
        this.lastNameChanged = false;
        this.usernameChanged = false;
        this.dobChanged = false;

        setTimeout(() => {
          this.updated = false;
        }, 2000);
      } else {
        this.loading = false;
        this.error = true;
        this.firstNameChanged = false;
        this.lastNameChanged = false;
        this.usernameChanged = false;
        this.dobChanged = false;

        setTimeout(() => {
          this.error = false;
        }, 2000);
      }
    });
  }

  nameReformat(name: string) {
    const res = name.split(' ');
    let formattedName = '';
    const length = res.length;
    for (let i = 0; i < length; i++) {
      if (i != 0) {
        formattedName += ' ';
      }

      formattedName += res[i].charAt(0).toUpperCase() + res[i].slice(1);
    }
    return formattedName;
  }

}
