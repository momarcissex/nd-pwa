import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SoldComponent } from './sold.component';

describe('SoldComponent', () => {
  let component: SoldComponent;
  let fixture: ComponentFixture<SoldComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SoldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SoldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
