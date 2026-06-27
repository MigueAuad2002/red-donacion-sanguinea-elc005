import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergenciasMapa } from './emergencias-mapa';

describe('EmergenciasMapa', () => {
  let component: EmergenciasMapa;
  let fixture: ComponentFixture<EmergenciasMapa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergenciasMapa],
    }).compileComponents();

    fixture = TestBed.createComponent(EmergenciasMapa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
