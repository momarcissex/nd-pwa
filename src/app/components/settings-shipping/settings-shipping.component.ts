import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { isUndefined, isNullOrUndefined } from 'util';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-settings-shipping',
  templateUrl: './settings-shipping.component.html',
  styleUrls: ['./settings-shipping.component.scss']
})
export class SettingsShippingComponent implements OnInit {

  shippingInfo: User["shippingAddress"] //shipping information
  UID: string //user id

  //current shipping information inputs
  firstName = ''
  lastName = ''
  street = ''
  line = ''
  city = ''
  province = ''
  postalCode = ''

  // input boolean controls
  firstNameChanged = false
  lastNameChanged = false
  streetChanged = false
  lineChanged = false
  cityChanged = false
  provinceChanged = false
  postalCodeChanged = false

  // btn boolean controls
  loading = false
  error = false
  updated = false

  redirectURI: string

  buying: boolean = false
  selling: boolean = false

  constructor(
    private router: Router,
    private auth: AuthService,
    private userService: UserService,
    private route: ActivatedRoute
  ) { }



  ngOnInit() {
    this.redirectURI = this.route.snapshot.queryParams.redirectURI

    if (this.route.snapshot.params.mode === 'buying') {
      this.buying = true
    } else if (this.route.snapshot.params.mode === 'selling') {
      this.selling = true
    } else {
      this.buying = false
      this.selling = false
    }

    if (this.buying || this.selling) {
      this.auth.isConnected().then(res => {
        if (isNullOrUndefined(res)) {
          this.router.navigate(['/login'], {
            queryParams: { redirectURI: 'settings/shipping' }
          })
        } else {
          this.UID = res.uid
          this.getShippingInfo(this.UID)
        }
      })
    }
  }

  getShippingInfo(UID: string) {
    this.userService.getUserInfo(UID).subscribe(data => {
      if (!isNullOrUndefined(data.shippingAddress)) {
        this.shippingInfo = data.shippingAddress
        let curShip: User["shippingAddress"]['buying'] | User["shippingAddress"]["selling"]

        this.buying ? curShip = this.shippingInfo.buying : curShip = this.shippingInfo.selling

        if (!isNullOrUndefined(curShip)) {
          this.firstName = curShip.firstName
          this.lastName = curShip.lastName
          this.street = curShip.street
          this.line = curShip.line2
          this.city = curShip.city
          this.province = curShip.province
          this.postalCode = curShip.postalCode;

          (document.getElementById('ship-state') as HTMLInputElement).value = this.province
        } else {
          this.firstName = data.firstName
          this.lastName = data.lastName
        }
      } else {
        this.firstName = data.firstName
        this.lastName = data.lastName
      }
    })
  }

  updateShipping() {
    if (this.streetChanged || this.lineChanged || this.cityChanged || this.provinceChanged || this.postalCodeChanged || this.firstNameChanged || this.lastNameChanged) {
      const firstName = (document.getElementById('ship-firstName') as HTMLInputElement).value;
      const lastName = (document.getElementById('ship-lastName') as HTMLInputElement).value;
      const street = (document.getElementById('ship-street') as HTMLInputElement).value;
      const line = (document.getElementById('ship-street2') as HTMLInputElement).value;
      const city = (document.getElementById('ship-city') as HTMLInputElement).value;
      const province = (document.getElementById('ship-state') as HTMLInputElement).value;
      const postalCode = (document.getElementById('ship-zip') as HTMLInputElement).value;
      const country = (document.getElementById('ship-country') as HTMLInputElement).value;

      //console.log(this.isEmptyOrBlank(firstName));

      if (!this.isEmptyOrBlank(firstName) && !this.isEmptyOrBlank(lastName) && !this.isEmptyOrBlank(street) && !this.isEmptyOrBlank(city) && !this.isEmptyOrBlank(province) && !this.isEmptyOrBlank(postalCode)) {
        this.loading = true;

        this.userService.updateShippingInfo(this.UID, firstName, lastName, street, line, city, province, postalCode, country, this.buying).then(res => {
          if (res) {
            this.loading = false;
            this.updated = true;
          } else {
            this.loading = false;
            this.error = true;
          }

          setTimeout(() => {
            this.error = false;
            this.updated = false;
            this.firstNameChanged = false;
            this.lastNameChanged = false;
            this.streetChanged = false;
            this.lineChanged = false;
            this.cityChanged = false;
            this.provinceChanged = false;
            this.postalCodeChanged = false;

            if (!isUndefined(this.redirectURI)) {
              this.backBtn();
            }
          }, 2000);
        });
      } else {
        this.error = true;

        setTimeout(() => {
          this.error = false;
        }, 1500);
      }
    }
  }

  firstNameChanges() {
    const firstName = (document.getElementById('ship-firstName') as HTMLInputElement).value;

    if (isUndefined(this.firstName) || (firstName.toLowerCase() != this.firstName.toLowerCase())) {
      this.firstNameChanged = true;
    } else {
      this.firstNameChanged = false;
    }
  }

  lastNameChanges() {
    const lastName = (document.getElementById('ship-lastName') as HTMLInputElement).value;

    if (isUndefined(this.lastName) || (lastName.toLowerCase() != this.lastName.toLowerCase())) {
      this.lastNameChanged = true;
    } else {
      this.lastNameChanged = false;
    }
  }

  streetAddChanges() {
    const street = (document.getElementById('ship-street') as HTMLInputElement).value;

    if (street.toLowerCase() != this.street.toLowerCase()) {
      this.streetChanged = true;
    } else {
      this.streetChanged = false;
    }
  }

  addLineChanges() {
    const line = (document.getElementById('ship-street2') as HTMLInputElement).value;

    if (line.toLowerCase() != this.line.toLowerCase()) {
      this.lineChanged = true;
    } else {
      this.lineChanged = false;
    }
  }

  cityChanges() {
    const city = (document.getElementById('ship-city') as HTMLInputElement).value;

    if (city.toLowerCase() != this.city.toLowerCase()) {
      this.cityChanged = true;
    } else {
      this.cityChanged = false;
    }
  }

  provinceChanges() {
    const province = (document.getElementById('ship-state') as HTMLInputElement).value;

    if (province.toLowerCase() != this.province.toLowerCase()) {
      this.provinceChanged = true;
    } else {
      this.provinceChanged = false;
    }
  }

  zipChanges() {
    const postalCode = (document.getElementById('ship-zip') as HTMLInputElement).value;

    if (postalCode.toLowerCase() != this.postalCode.toLowerCase()) {
      this.postalCodeChanged = true;
    } else {
      this.postalCodeChanged = false;
    }
  }

  isEmptyOrBlank(str) {
    return (str.length === 0 || !str.trim());
  }

  backBtn() {
    if (isUndefined(this.redirectURI)) {
      this.router.navigate(['/settings/shipping']);
    } else {
      this.router.navigateByUrl(this.redirectURI);
    }
  }

}
