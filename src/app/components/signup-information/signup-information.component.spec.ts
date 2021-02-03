import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SignupInformationComponent } from './signup-information.component';

describe('SignupInformationComponent', () => {
  let component: SignupInformationComponent;
  let fixture: ComponentFixture<SignupInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SignupInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
