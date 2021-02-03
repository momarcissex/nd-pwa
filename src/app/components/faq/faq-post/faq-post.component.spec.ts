import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FaqPostComponent } from './faq-post.component';

describe('FaqPostComponent', () => {
  let component: FaqPostComponent;
  let fixture: ComponentFixture<FaqPostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FaqPostComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaqPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
