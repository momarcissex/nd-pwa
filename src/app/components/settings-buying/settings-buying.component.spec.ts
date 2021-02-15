import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SettingsBuyingComponent } from './settings-buying.component';

describe('SettingsBuyingComponent', () => {
  let component: SettingsBuyingComponent;
  let fixture: ComponentFixture<SettingsBuyingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsBuyingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsBuyingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
