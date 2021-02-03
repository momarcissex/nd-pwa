import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransactionReviewComponent } from './transaction-review.component';

describe('TransactionReviewComponent', () => {
  let component: TransactionReviewComponent;
  let fixture: ComponentFixture<TransactionReviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TransactionReviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
