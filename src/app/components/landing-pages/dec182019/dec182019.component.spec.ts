import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Dec182019Component } from './dec182019.component';

describe('Dec182019Component', () => {
  let component: Dec182019Component;
  let fixture: ComponentFixture<Dec182019Component>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Dec182019Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Dec182019Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
