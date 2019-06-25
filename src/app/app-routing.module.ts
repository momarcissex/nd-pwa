import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Components
import { HomeComponent } from './components/home/home.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LoginComponent } from './components/login/login.component';
import { ProductComponent } from './components/product/product.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SettingsProfileComponent } from './components/settings-profile/settings-profile.component';
import { SettingsPasswordComponent } from './components/settings-password/settings-password.component';
import { SettingsBuyingComponent } from './components/settings-buying/settings-buying.component';
import { SettingsSellingComponent } from './components/settings-selling/settings-selling.component';
import { SettingsShippingComponent } from './components/settings-shipping/settings-shipping.component';
import { SettingsPayoutComponent } from './components/settings-payout/settings-payout.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent},
  { path: 'signup', component: SignUpComponent },
  { path: 'login', component: LoginComponent },
  { path: 'product', component: ProductComponent},
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'settings/profile', component: SettingsProfileComponent },
  { path: 'settings/password', component: SettingsPasswordComponent },
  { path: 'settings/buying', component: SettingsBuyingComponent },
  { path: 'settings/selling', component: SettingsSellingComponent },
  { path: 'settings/shipping', component: SettingsShippingComponent },
  { path: 'settings/payout', component: SettingsPayoutComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
