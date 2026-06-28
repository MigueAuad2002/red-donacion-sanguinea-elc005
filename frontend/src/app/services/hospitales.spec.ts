import { TestBed } from '@angular/core/testing';

import { Hospitales } from './hospitales';

describe('Hospitales', () => {
  let service: Hospitales;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Hospitales);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
