import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MakeAnOfferComponent } from './make-an-offer.component';

describe('MakeAnOfferComponent', () => {
  let component: MakeAnOfferComponent;
  let fixture: ComponentFixture<MakeAnOfferComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MakeAnOfferComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MakeAnOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
