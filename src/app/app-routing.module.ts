import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Components
import { HomeComponent } from './components/home/home.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LoginComponent } from './components/login/login.component';
import { ProductComponent } from './components/product/product.component';
//import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SettingsProfileComponent } from './components/settings-profile/settings-profile.component';
import { SettingsPasswordComponent } from './components/settings-password/settings-password.component';
//import { SettingsBuyingComponent } from './components/settings-buying/settings-buying.component';
//import { SettingsSellingComponent } from './components/settings-selling/settings-selling.component';
import { SettingsShippingComponent } from './components/settings-shipping/settings-shipping.component';
//import { SettingsPayoutComponent } from './components/settings-payout/settings-payout.component';
import { TransactionReviewComponent } from './components/transaction-review/transaction-review.component';
import { SellComponent } from './components/sell/sell.component';
import { SearchComponent } from './components/search/search.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EditListingComponent } from './components/edit-listing/edit-listing.component';
import { RequestComponent } from './components/request/request.component';
import { ForgetPasswordComponent } from './components/forget-password/forget-password.component';
import { ActivateAccountComponent } from './components/activate-account/activate-account.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { LoggedOutComponent } from './components/logged-out/logged-out.component';
import { SignupInformationComponent } from './components/signup-information/signup-information.component';
import { MakeAnOfferComponent } from './components/make-an-offer/make-an-offer.component';
import { EditOfferComponent } from './components/edit-offer/edit-offer.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { AuthComponent } from './components/auth/auth.component';
import { PhoneVerificationComponent } from './components/phone-verification/phone-verification.component';
import { SoldComponent } from './components/sold/sold.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { TermsComponent } from './components/terms/terms.component';
import { DropComponent } from './components/special-drop/drop/drop.component';
import { BlogHomeComponent } from './components/blog/blog-home/blog-home.component';
import { BlogPostComponent } from './components/blog/blog-post/blog-post.component';
import { SnkrsComponent } from './components/snkrs/snkrs.component';
import { Dec182019Component } from './components/landing-pages/dec182019/dec182019.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { ReferralComponent } from './components/referral/referral.component';
import { FaqHomeComponent } from './components/faq/faq-home/faq-home.component';
import { FaqPostComponent } from './components/faq/faq-post/faq-post.component';
import { FaqCategoryComponent } from './components/faq/faq-category/faq-category.component';
import { SaleConfirmationComponent } from './components/sale-confirmation/sale-confirmation.component';
import { SettingsEmailComponent } from './components/settings-email/settings-email.component';
import { RecoverEmailComponent } from './components/recover-email/recover-email.component';
import { ReferralProgramComponent } from './components/referral-program/referral-program.component';
import { ContestComponent } from './components/contest/contest.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'login', component: LoginComponent },
  { path: 'product/:id', component: ProductComponent },
  // { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'settings/profile', component: SettingsProfileComponent },
  { path: 'settings/password', component: SettingsPasswordComponent },
  //{ path: 'settings/buying', component: SettingsBuyingComponent },
  //{ path: 'settings/selling', component: SettingsSellingComponent },
  { path: 'settings/shipping', component: SettingsShippingComponent },
  { path: 'settings/shipping/:mode', component: SettingsShippingComponent },
  { path: 'settings/shipping/:mode', component: SettingsShippingComponent },
  //{ path: 'settings/payout', component: SettingsPayoutComponent },
  { path: 'transaction', component: TransactionReviewComponent },
  { path: 'sell', component: SellComponent },
  { path: 'search', component: SearchComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'dashboard/:id', component: DashboardComponent },
  { path: 'edit-listing/:id', component: EditListingComponent },
  { path: 'edit-offer/:id', component: EditOfferComponent },
  { path: 'edit-ask/:id', component: EditListingComponent },
  { path: 'edit-bid/:id', component: EditOfferComponent },
  { path: 'request', component: RequestComponent },
  { path: 'forgot-password', component: ForgetPasswordComponent },
  { path: 'activate-account', component: ActivateAccountComponent },
  { path: 'support', component: ContactUsComponent },
  { path: 'bye', component: LoggedOutComponent },
  { path: 'additional-information', component: SignupInformationComponent },
  { path: 'make-an-offer', component: MakeAnOfferComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'phone-verification', component: PhoneVerificationComponent },
  { path: 'sold', component: SoldComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'drop/:id', component: DropComponent },
  { path: 'news', component: BlogHomeComponent },
  { path: 'news/:title', component: BlogPostComponent },
  { path: 'snkrs', component: SnkrsComponent },
  { path: 'here-is-the-perfect-solution-if-you-want-to-buy-sneakers', component: Dec182019Component },
  { path: 'how-it-works', component: HowItWorksComponent },
  { path: 'invite-a-friend', component: ReferralComponent },
  { path: 'faq', component: FaqHomeComponent },
  { path: 'faq/:category', component: FaqCategoryComponent },
  { path: 'faq/:category/:post', component: FaqPostComponent },
  { path: 'confirmation/:id/:seller', component: SaleConfirmationComponent },
  { path: 'settings/email', component: SettingsEmailComponent },
  { path: 'recover-email', component: RecoverEmailComponent },
  { path: 'referral', component: ReferralProgramComponent },
  { path: 'contest', component: ContestComponent },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
