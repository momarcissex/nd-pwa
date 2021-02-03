import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SpecialDropHomeComponent } from './home.component';

describe('SpecialDropHomeComponent', () => {
  let component: SpecialDropHomeComponent;
  let fixture: ComponentFixture<SpecialDropHomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SpecialDropHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecialDropHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
