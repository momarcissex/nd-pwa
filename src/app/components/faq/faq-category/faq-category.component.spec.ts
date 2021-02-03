import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FaqCategoryComponent } from './faq-category.component';

describe('FaqCategoryComponent', () => {
  let component: FaqCategoryComponent;
  let fixture: ComponentFixture<FaqCategoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FaqCategoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaqCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
