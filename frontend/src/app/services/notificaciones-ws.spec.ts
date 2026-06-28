import { TestBed } from '@angular/core/testing';

import { NotificacionesWs } from './notificaciones-ws';

describe('NotificacionesWs', () => {
  let service: NotificacionesWs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificacionesWs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
