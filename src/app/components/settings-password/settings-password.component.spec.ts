import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SettingsPasswordComponent } from './settings-password.component';

describe('SettingsPasswordComponent', () => {
  let component: SettingsPasswordComponent;
  let fixture: ComponentFixture<SettingsPasswordComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsPasswordComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
