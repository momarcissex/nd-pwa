/** Modules */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { environment } from 'src/environments/environment';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Globals } from './globals';

export function appInit(globals: Globals) {
  return () => globals.load()
}

/** Components */
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { LoginComponent } from './components/login/login.component';
import { CarouselComponent } from './components/carousel/carousel.component';
import { TrendingComponent } from './components/trending/trending.component';
import { NewReleasesComponent } from './components/new-releases/new-releases.component';
import { DiscoveryComponent } from './components/discovery/discovery.component';
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
import { TransactionReviewComponent } from './components/transaction-review/transaction-review.component';
import { SellComponent } from './components/sell/sell.component';
import { SearchComponent } from './components/search/search.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { SideMenuComponent } from './components/side-menu/side-menu.component';
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
import { ModalComponent } from './components/modal/modal.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { TermsComponent } from './components/terms/terms.component';
import { BlogHomeComponent } from './components/blog/blog-home/blog-home.component';
import { BlogPostComponent } from './components/blog/blog-post/blog-post.component';
import { SnkrsComponent } from './components/snkrs/snkrs.component';
import { ListingsComponent } from './components/listings/listings.component';
import { OffersComponent } from './components/offers/offers.component';
import { Dec182019Component } from './components/landing-pages/dec182019//dec182019.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { ReferralComponent } from './components/referral/referral.component';
import { FaqHomeComponent } from './components/faq/faq-home/faq-home.component';
import { FaqCategoryComponent } from './components/faq/faq-category/faq-category.component';
import { FaqPostComponent } from './components/faq/faq-post/faq-post.component';
import { SaleConfirmationComponent } from './components/sale-confirmation/sale-confirmation.component';
import { TrustboxComponent } from './components/trustbox/trustbox.component';
import { RecentlyViewedComponent } from './components/recently-viewed/recently-viewed.component';
import { UpcomingReleasesComponent } from './components/upcoming-releases/upcoming-releases.component';
import { SneakPeekComponent } from './components/sneak-peek/sneak-peek.component';

/** Font Awesome */
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Firebase Setup
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { AngularFireStorageModule } from '@angular/fire/storage';

// Reactive Forms
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Mask Module
import { NgxMaskModule } from 'ngx-mask';

import { NgxPayPalModule } from 'ngx-paypal';
import { SafeHtmlPipe } from './pipes/safeHtml.pipes';
import { NewsletterComponent } from './components/newsletter/newsletter.component';
import { SettingsEmailComponent } from './components/settings-email/settings-email.component';
import { RecoverEmailComponent } from './components/recover-email/recover-email.component';
import { ContestComponent } from './components/contest/contest.component';
import { ExtendAskBidComponent } from './components/extend-ask-bid/extend-ask-bid.component';

import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OnlyNumberDirective } from './directives/only-number.directive';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    FooterComponent,
    SignUpComponent,
    LoginComponent,
    CarouselComponent,
    TrendingComponent,
    NewReleasesComponent,
    DiscoveryComponent,
    ProductComponent,
    CartComponent,
    CheckoutComponent,
    ProfileComponent,
    SettingsComponent,
    SettingsProfileComponent,
    SettingsPasswordComponent,
    SettingsBuyingComponent,
    SettingsSellingComponent,
    SettingsShippingComponent,
    SettingsPayoutComponent,
    TransactionReviewComponent,
    SellComponent,
    SearchComponent,
    DashboardComponent,
    NotificationsComponent,
    SideMenuComponent,
    EditListingComponent,
    RequestComponent,
    ForgetPasswordComponent,
    ActivateAccountComponent,
    ContactUsComponent,
    LoggedOutComponent,
    SignupInformationComponent,
    MakeAnOfferComponent,
    EditOfferComponent,
    ResetPasswordComponent,
    AuthComponent,
    PhoneVerificationComponent,
    SoldComponent,
    PageNotFoundComponent,
    ModalComponent,
    PrivacyComponent,
    TermsComponent,
    BlogHomeComponent,
    BlogPostComponent,
    SnkrsComponent,
    SafeHtmlPipe,
    ListingsComponent,
    OffersComponent,
    Dec182019Component,
    HowItWorksComponent,
    ReferralComponent,
    FaqHomeComponent,
    FaqPostComponent,
    FaqCategoryComponent,
    SaleConfirmationComponent,
    TrustboxComponent,
    NewsletterComponent,
    SettingsEmailComponent,
    RecoverEmailComponent,
    ContestComponent,
    ExtendAskBidComponent,
    OnlyNumberDirective,
    RecentlyViewedComponent,
    UpcomingReleasesComponent,
    SneakPeekComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    FontAwesomeModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireMessagingModule,
    AngularFireStorageModule,
    ReactiveFormsModule,
    FormsModule,
    NgxMaskModule.forRoot(),
    HttpClientModule,
    HttpClientJsonpModule,
    NgxPayPalModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot(), // ToastrModule added
  ],
  providers: [
    CookieService,
    Globals,
    {
      provide: APP_INITIALIZER,
      useFactory: appInit,
      multi: true,
      deps: [Globals]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
  }
}
