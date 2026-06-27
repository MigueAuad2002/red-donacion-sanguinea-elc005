import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface PuntoEmergencia {
  id: number;
  hospital: string;
  grupo: string;
  prioridad: string;
  latitud: number;
  longitud: number;
}

@Component({
  selector: 'app-emergencias-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './emergencias-mapa.html'
})
export class EmergenciasMapaComponent {
  puntos: PuntoEmergencia[] = [
    {
      id: 1,
      hospital: 'Hospital Universitario Japonés',
      grupo: 'O+',
      prioridad: 'ALTA',
      latitud: -17.7692,
      longitud: -63.1821
    },
    {
      id: 2,
      hospital: 'Hospital San Juan de Dios',
      grupo: 'A-',
      prioridad: 'MEDIA',
      latitud: -17.7833,
      longitud: -63.1821
    }
  ];

  constructor(private router: Router) {}

  volverLista(): void {
    this.router.navigate(['/emergencias']);
  }

  volverHome(): void {
    this.router.navigate(['/home']);
  }
}