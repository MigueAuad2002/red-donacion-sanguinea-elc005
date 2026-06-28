import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompatibilidadSanguinea } from './compatibilidad-sanguinea';

describe('CompatibilidadSanguinea', () => {
  let component: CompatibilidadSanguinea;
  let fixture: ComponentFixture<CompatibilidadSanguinea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompatibilidadSanguinea],
    }).compileComponents();

    fixture = TestBed.createComponent(CompatibilidadSanguinea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
