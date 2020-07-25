import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendAskBidComponent } from './extend-ask-bid.component';

describe('ExtendAskBidComponent', () => {
  let component: ExtendAskBidComponent;
  let fixture: ComponentFixture<ExtendAskBidComponent>;

  beforeEach(async(() => {
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
