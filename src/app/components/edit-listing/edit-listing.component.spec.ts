import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditListingComponent } from './edit-listing.component';

describe('EditOfferComponent', () => {
  let component: EditListingComponent;
  let fixture: ComponentFixture<EditListingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
