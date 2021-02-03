import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExtendAskBidComponent } from './extend-ask-bid.component';

describe('ExtendAskBidComponent', () => {
  let component: ExtendAskBidComponent;
  let fixture: ComponentFixture<ExtendAskBidComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExtendAskBidComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtendAskBidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
