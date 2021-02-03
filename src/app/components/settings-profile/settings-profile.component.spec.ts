import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SettingsProfileComponent } from './settings-profile.component';

describe('SettingsProfileComponent', () => {
  let component: SettingsProfileComponent;
  let fixture: ComponentFixture<SettingsProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
