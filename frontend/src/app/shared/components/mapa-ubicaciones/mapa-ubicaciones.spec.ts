import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaUbicaciones } from './mapa-ubicaciones';

describe('MapaUbicaciones', () => {
  let component: MapaUbicaciones;
  let fixture: ComponentFixture<MapaUbicaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaUbicaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaUbicaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
