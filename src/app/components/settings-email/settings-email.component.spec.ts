import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SettingsEmailComponent } from './settings-email.component';

describe('SettingsEmailComponent', () => {
  let component: SettingsEmailComponent;
  let fixture: ComponentFixture<SettingsEmailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsEmailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
