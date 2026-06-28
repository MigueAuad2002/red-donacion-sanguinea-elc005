import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hospitales } from './hospitales';

describe('Hospitales', () => {
  let component: Hospitales;
  let fixture: ComponentFixture<Hospitales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hospitales],
    }).compileComponents();

    fixture = TestBed.createComponent(Hospitales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
