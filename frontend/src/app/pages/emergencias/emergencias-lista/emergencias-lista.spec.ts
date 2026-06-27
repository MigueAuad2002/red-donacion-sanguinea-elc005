import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergenciasLista } from './emergencias-lista';

describe('EmergenciasLista', () => {
  let component: EmergenciasLista;
  let fixture: ComponentFixture<EmergenciasLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergenciasLista],
    }).compileComponents();

    fixture = TestBed.createComponent(EmergenciasLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
