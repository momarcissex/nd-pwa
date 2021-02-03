import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ContestComponent } from './contest.component';

describe('ContestComponent', () => {
  let component: ContestComponent;
  let fixture: ComponentFixture<ContestComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ContestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
