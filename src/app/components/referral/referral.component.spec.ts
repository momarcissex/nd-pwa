import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReferralComponent } from './referral.component';

describe('ReferralComponent', () => {
  let component: ReferralComponent;
  let fixture: ComponentFixture<ReferralComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReferralComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
