import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { User } from 'src/app/models/user';
import { faCcAmex, faCcMastercard, faCcVisa } from '@fortawesome/free-brands-svg-icons';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-settings-buying',
  templateUrl: './settings-buying.component.html',
  styleUrls: ['./settings-buying.component.scss']
})
export class SettingsBuyingComponent implements OnInit {

  faCcAmex = faCcAmex
  faCcMastercard = faCcMastercard
  faCcVisa = faCcVisa
  faCircleNotch = faCircleNotch

  shippingInfo: User['shipping_address']['buying'];

  billingInfo = {
    street: '',
    line: '',
    city: '',
    postalCode: '',
    province: '',
    country: '',
    firstName: '',
    lastName: ''
  };

  userInfo = {
    uid: '',
    phoneNumber: ''
  };

  redirectURI: string;

  ccIsVisa: boolean;
  ccIsMastercard: boolean;
  ccIsAmex: boolean;
  isSameAddress = false;
  loading = false;
  error = false;
  updated = false;

  firstNameChanged = false;
  lastNameChanged = false;
  cityChanged = false;
  streetChanged = false;
  provinceChanged = false;
  lineChanged = false;
  postalCodeChanged = false;
  countryChanged = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private auth: AuthService
  ) { }

  ngOnInit() {
    this.redirectURI = this.route.snapshot.queryParams.redirectURI;

    this.auth.isConnected().then(res => {
      if (res === undefined) {

      } else {
        this.userService.getUserInfo(res.uid).subscribe(data => {
          this.shippingInfo = data.shipping_address.buying;
        });
      }
    })
  }

  isEmptyOrBlank(str) {
    return (str.length === 0 || !str.trim());
  }

  backBtn() {
    if (this.redirectURI === undefined) {
      this.router.navigate(['..']);
    } else {
      this.router.navigate([`../../${this.redirectURI}`]);
    }
  }

  ccCheck($event) {
    const ccNum = $event.target.value;

    if (this.isVisa(ccNum)) {
      this.ccIsVisa = true;
      this.ccIsMastercard = false;
      this.ccIsAmex = false;
    } else if (this.isMastercard(ccNum)) {
      this.ccIsVisa = false;
      this.ccIsMastercard = true;
      this.ccIsAmex = false;
    } else if (this.isAmex(ccNum)) {
      this.ccIsVisa = false;
      this.ccIsMastercard = false;
      this.ccIsAmex = true;
    } else {
      this.ccIsVisa = false;
      this.ccIsMastercard = false;
      this.ccIsAmex = false;
    }
  }

  isVisa(ccNum: string): boolean {
    return ccNum.slice(0, 1) === '4' ? true : false;
  }

  isMastercard(ccNum: string): boolean {
    return new RegExp('51').test(ccNum.slice(0, 2)) || new RegExp('52').test(ccNum.slice(0, 2)) || new RegExp('53').test(ccNum.slice(0, 2)) || new RegExp('54').test(ccNum.slice(0, 2)) || new RegExp('55').test(ccNum.slice(0, 2)) || (+ccNum.replace(' ', '').slice(0, 6) >= 222100 && +ccNum.replace(' ', '').slice(0, 6) <= 272099) ? true : false;
  }

  isAmex(ccNum): boolean {
    return new RegExp('34').test(ccNum.slice(0, 2)) || new RegExp('37').test(ccNum.slice(0, 2)) ? true : false;
  }

  sameAddress() {
    if (this.isSameAddress) {
      this.isSameAddress = false;
    } else {
      this.isSameAddress = true;
    }
  }

  firstNameChanges() {
    const firstName = (document.getElementById('cc-firstName') as HTMLInputElement).value;

    if (this.billingInfo.firstName === undefined || (firstName.toLowerCase() != this.billingInfo.firstName.toLowerCase())) {
      this.firstNameChanged = true;
    } else {
      this.firstNameChanged = false;
    }
  }

  lastNameChanges() {
    const lastName = (document.getElementById('cc-lastName') as HTMLInputElement).value;

    if (this.billingInfo.lastName === undefined || (lastName.toLowerCase() != this.billingInfo.lastName.toLowerCase())) {
      this.lastNameChanged = true;
    } else {
      this.lastNameChanged = false;
    }
  }

  streetChanges() {
    const street = (document.getElementById('cc-street') as HTMLInputElement).value;

    if (street.toLowerCase() != this.billingInfo.street.toLowerCase()) {
      this.streetChanged = true;
    } else {
      this.streetChanged = false;
    }
  }

  lineChanges() {
    const line = (document.getElementById('cc-line') as HTMLInputElement).value;

    if (line.toLowerCase() != this.billingInfo.line.toLowerCase()) {
      this.lineChanged = true;
    } else {
      this.lineChanged = false;
    }
  }

  cityChanges() {
    const city = (document.getElementById('cc-city') as HTMLInputElement).value;

    if (city.toLowerCase() != this.billingInfo.city.toLowerCase()) {
      this.cityChanged = true;
    } else {
      this.cityChanged = false;
    }
  }

  provinceChanges() {
    const province = (document.getElementById('cc-state') as HTMLInputElement).value;

    if (province.toLowerCase() != this.billingInfo.province.toLowerCase()) {
      this.provinceChanged = true;
    } else {
      this.provinceChanged = false;
    }
  }

  zipChanges() {
    const postalCode = (document.getElementById('cc-zip') as HTMLInputElement).value;

    if (postalCode.toLowerCase() != this.billingInfo.postalCode.toLowerCase()) {
      this.postalCodeChanged = true;
    } else {
      this.postalCodeChanged = false;
    }
  }

  countryChanges() {
    const country = (document.getElementById('cc-zip') as HTMLInputElement).value;

    if (country.toLowerCase() != this.billingInfo.country.toLowerCase()) {
      this.countryChanged = true;
    } else {
      this.countryChanged = false;
    }
  }

  

}
