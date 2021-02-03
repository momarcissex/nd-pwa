import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HowItWorksComponent } from './how-it-works.component';

describe('HowItWorksComponent', () => {
    let component: HowItWorksComponent;
    let fixture: ComponentFixture<HowItWorksComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [HowItWorksComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HowItWorksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
