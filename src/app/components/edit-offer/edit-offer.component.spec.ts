import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditOfferComponent } from './edit-offer.component';

describe('EditOfferComponent', () => {
  let component: EditOfferComponent;
  let fixture: ComponentFixture<EditOfferComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditOfferComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
