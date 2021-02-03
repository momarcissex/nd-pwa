import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReferralProgramComponent } from './referral-program.component';

describe('ReferralProgramComponent', () => {
  let component: ReferralProgramComponent;
  let fixture: ComponentFixture<ReferralProgramComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReferralProgramComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferralProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
