import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SettingsShippingComponent } from './settings-shipping.component';

describe('SettingsShippingComponent', () => {
  let component: SettingsShippingComponent;
  let fixture: ComponentFixture<SettingsShippingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsShippingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsShippingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
