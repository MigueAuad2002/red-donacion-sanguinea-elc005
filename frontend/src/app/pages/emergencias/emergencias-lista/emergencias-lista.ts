import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type EstadoEmergencia = 'PENDIENTE' | 'EN_PROCESO' | 'ATENDIDA' | 'CANCELADA';
type PrioridadEmergencia = 'ALTA' | 'MEDIA' | 'BAJA';

interface Emergencia {
  id: number;
  paciente: string;
  hospital: string;
  tipo_sangre: string;
  factor_rh: string;
  prioridad: PrioridadEmergencia;
  estado: EstadoEmergencia;
  fecha: string;
  hora: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

@Component({
  selector: 'app-emergencias-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emergencias-lista.html'
})
export class EmergenciasListaComponent {
  busqueda = '';
  estadoSeleccionado = 'TODOS';
  prioridadSeleccionada = 'TODAS';

  emergencias: Emergencia[] = [
    {
      id: 1,
      paciente: 'Paciente reservado',
      hospital: 'Hospital Universitario Japonés',
      tipo_sangre: 'O',
      factor_rh: '+',
      prioridad: 'ALTA',
      estado: 'PENDIENTE',
      fecha: '2026-06-26',
      hora: '10:30',
      direccion: 'Av. Japón, Santa Cruz',
      latitud: -17.7692,
      longitud: -63.1821
    },
    {
      id: 2,
      paciente: 'Paciente reservado',
      hospital: 'Hospital San Juan de Dios',
      tipo_sangre: 'A',
      factor_rh: '-',
      prioridad: 'MEDIA',
      estado: 'EN_PROCESO',
      fecha: '2026-06-26',
      hora: '11:15',
      direccion: 'Zona Centro, Santa Cruz',
      latitud: -17.7833,
      longitud: -63.1821
    },
    {
      id: 3,
      paciente: 'Paciente reservado',
      hospital: 'Clínica Foianini',
      tipo_sangre: 'B',
      factor_rh: '+',
      prioridad: 'BAJA',
      estado: 'ATENDIDA',
      fecha: '2026-06-25',
      hora: '18:40',
      direccion: 'Equipetrol, Santa Cruz',
      latitud: -17.7597,
      longitud: -63.1991
    },
    {
      id: 4,
      paciente: 'Paciente reservado',
      hospital: 'Caja Petrolera de Salud',
      tipo_sangre: 'AB',
      factor_rh: '+',
      prioridad: 'ALTA',
      estado: 'PENDIENTE',
      fecha: '2026-06-26',
      hora: '12:05',
      direccion: 'Av. Cristo Redentor, Santa Cruz',
      latitud: -17.7554,
      longitud: -63.1712
    }
  ];

  constructor(private router: Router) {}

  get emergenciasFiltradas(): Emergencia[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.emergencias.filter((emergencia) => {
      const coincideTexto =
        !texto ||
        emergencia.hospital.toLowerCase().includes(texto) ||
        emergencia.tipo_sangre.toLowerCase().includes(texto) ||
        emergencia.factor_rh.toLowerCase().includes(texto) ||
        emergencia.direccion.toLowerCase().includes(texto);

      const coincideEstado =
        this.estadoSeleccionado === 'TODOS' ||
        emergencia.estado === this.estadoSeleccionado;

      const coincidePrioridad =
        this.prioridadSeleccionada === 'TODAS' ||
        emergencia.prioridad === this.prioridadSeleccionada;

      return coincideTexto && coincideEstado && coincidePrioridad;
    });
  }

  get totalPendientes(): number {
    return this.emergencias.filter(e => e.estado === 'PENDIENTE').length;
  }

  get totalProceso(): number {
    return this.emergencias.filter(e => e.estado === 'EN_PROCESO').length;
  }

  get totalAtendidas(): number {
    return this.emergencias.filter(e => e.estado === 'ATENDIDA').length;
  }

  grupoSanguineo(emergencia: Emergencia): string {
    return `${emergencia.tipo_sangre}${emergencia.factor_rh}`;
  }

  formatearFecha(fecha: string): string {
    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  textoEstado(estado: EstadoEmergencia): string {
    const estados: Record<EstadoEmergencia, string> = {
      PENDIENTE: 'Pendiente',
      EN_PROCESO: 'En proceso',
      ATENDIDA: 'Atendida',
      CANCELADA: 'Cancelada'
    };

    return estados[estado];
  }

  claseEstado(estado: EstadoEmergencia): string {
    const clases: Record<EstadoEmergencia, string> = {
      PENDIENTE: 'bg-[#FDF2F2] text-[#9B1A1A] border-[#E8BFBF]',
      EN_PROCESO: 'bg-amber-50 text-amber-700 border-amber-200',
      ATENDIDA: 'bg-green-50 text-green-700 border-green-200',
      CANCELADA: 'bg-gray-100 text-gray-600 border-gray-200'
    };

    return clases[estado];
  }

  clasePrioridad(prioridad: PrioridadEmergencia): string {
    const clases: Record<PrioridadEmergencia, string> = {
      ALTA: 'bg-[#9B1A1A] text-white',
      MEDIA: 'bg-amber-600 text-white',
      BAJA: 'bg-gray-600 text-white'
    };

    return clases[prioridad];
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.estadoSeleccionado = 'TODOS';
    this.prioridadSeleccionada = 'TODAS';
  }

  irMapa(): void {
    this.router.navigate(['/emergencias/mapa']);
  }

  volverHome(): void {
    this.router.navigate(['/home']);
  }
}