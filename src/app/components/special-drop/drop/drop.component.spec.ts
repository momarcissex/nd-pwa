import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DropComponent } from './drop.component';

describe('DropComponent', () => {
  let component: DropComponent;
  let fixture: ComponentFixture<DropComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DropComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
