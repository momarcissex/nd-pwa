import { TestBed } from '@angular/core/testing';

import { NxtdropCcService } from './nxtdrop-cc.service';

describe('NxtdropCcService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NxtdropCcService = TestBed.get(NxtdropCcService);
    expect(service).toBeTruthy();
  });
});
