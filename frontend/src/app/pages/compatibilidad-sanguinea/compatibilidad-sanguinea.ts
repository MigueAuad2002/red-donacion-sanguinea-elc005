import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService, UsuarioSesion } from '../../services/auth';

type GrupoSanguineo = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

interface CompatibilidadInfo {
  grupo: GrupoSanguineo;
  puedeDonarA: GrupoSanguineo[];
  puedeRecibirDe: GrupoSanguineo[];
  resumenDonacion: string;
  resumenRecepcion: string;
}

@Component({
  selector: 'app-compatibilidad-sanguinea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compatibilidad-sanguinea.html'
})
export class CompatibilidadSanguineaComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  usuario: UsuarioSesion | null = null;

  grupoUsuario: GrupoSanguineo | null = null;
  compatibilidad: CompatibilidadInfo | null = null;

  gotaActiva = false;
  bolsaActiva = false;

  gruposSanguineos: GrupoSanguineo[] = [
    'O-',
    'O+',
    'A-',
    'A+',
    'B-',
    'B+',
    'AB-',
    'AB+'
  ];

  private reglasCompatibilidad: Record<GrupoSanguineo, CompatibilidadInfo> = {
    'O-': {
      grupo: 'O-',
      puedeDonarA: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      puedeRecibirDe: ['O-'],
      resumenDonacion: 'Donante universal para glóbulos rojos.',
      resumenRecepcion: 'Solo puede recibir sangre O-.'
    },
    'O+': {
      grupo: 'O+',
      puedeDonarA: ['O+', 'A+', 'B+', 'AB+'],
      puedeRecibirDe: ['O-', 'O+'],
      resumenDonacion: 'Puede donar a grupos positivos compatibles.',
      resumenRecepcion: 'Puede recibir de O- y O+.'
    },
    'A-': {
      grupo: 'A-',
      puedeDonarA: ['A-', 'A+', 'AB-', 'AB+'],
      puedeRecibirDe: ['O-', 'A-'],
      resumenDonacion: 'Puede donar a grupos A y AB.',
      resumenRecepcion: 'Puede recibir de O- y A-.'
    },
    'A+': {
      grupo: 'A+',
      puedeDonarA: ['A+', 'AB+'],
      puedeRecibirDe: ['O-', 'O+', 'A-', 'A+'],
      resumenDonacion: 'Puede donar a A+ y AB+.',
      resumenRecepcion: 'Puede recibir de O y A compatibles.'
    },
    'B-': {
      grupo: 'B-',
      puedeDonarA: ['B-', 'B+', 'AB-', 'AB+'],
      puedeRecibirDe: ['O-', 'B-'],
      resumenDonacion: 'Puede donar a grupos B y AB.',
      resumenRecepcion: 'Puede recibir de O- y B-.'
    },
    'B+': {
      grupo: 'B+',
      puedeDonarA: ['B+', 'AB+'],
      puedeRecibirDe: ['O-', 'O+', 'B-', 'B+'],
      resumenDonacion: 'Puede donar a B+ y AB+.',
      resumenRecepcion: 'Puede recibir de O y B compatibles.'
    },
    'AB-': {
      grupo: 'AB-',
      puedeDonarA: ['AB-', 'AB+'],
      puedeRecibirDe: ['O-', 'A-', 'B-', 'AB-'],
      resumenDonacion: 'Puede donar principalmente a grupos AB.',
      resumenRecepcion: 'Puede recibir sangre negativa compatible.'
    },
    'AB+': {
      grupo: 'AB+',
      puedeDonarA: ['AB+'],
      puedeRecibirDe: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      resumenDonacion: 'Puede donar a AB+.',
      resumenRecepcion: 'Receptor universal para glóbulos rojos.'
    }
  };

  ngOnInit(): void {
    this.cargarUsuario();
  }

  cargarUsuario(): void {
    this.usuario = this.authService.getUser();

    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }

    const grupo = this.construirGrupoSanguineo(
      this.usuario.tipo_sangre,
      this.usuario.factor_rh
    );

    this.grupoUsuario = grupo;
    this.compatibilidad = grupo ? this.reglasCompatibilidad[grupo] : null;

    this.cdr.detectChanges();
  }

  activarBolsa(): void {
    this.bolsaActiva = true;
    this.gotaActiva = true;

    setTimeout(() => {
      this.ngZone.run(() => {
        this.gotaActiva = false;
        this.cdr.detectChanges();
      });
    }, 800);

    setTimeout(() => {
      this.ngZone.run(() => {
        this.bolsaActiva = false;
        this.cdr.detectChanges();
      });
    }, 420);

    this.cdr.detectChanges();
  }

  volverPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  volverHome(): void {
    this.router.navigate(['/home']);
  }

  esDonacionCompatible(grupo: GrupoSanguineo): boolean {
    return this.compatibilidad?.puedeDonarA.includes(grupo) || false;
  }

  esRecepcionCompatible(grupo: GrupoSanguineo): boolean {
    return this.compatibilidad?.puedeRecibirDe.includes(grupo) || false;
  }

  claseGrupoBase(grupo: GrupoSanguineo): string {
    if (grupo === this.grupoUsuario) {
      return 'border-[#9B1A1A] bg-[#9B1A1A] text-white shadow-sm';
    }

    return 'border-[#DADADA] bg-white text-gray-700';
  }

  claseChipCompatible(esCompatible: boolean): string {
    return esCompatible
      ? 'border-[#E8BFBF] bg-[#FDF2F2] text-[#9B1A1A]'
      : 'border-[#EBEBEB] bg-[#FAFAFA] text-gray-300';
  }

  obtenerInicial(): string {
    return this.usuario?.nombre_completo?.trim()?.charAt(0) || 'U';
  }

  obtenerNombre(): string {
    return this.usuario?.nombre_completo || 'Usuario';
  }

  obtenerRol(): string {
    return this.usuario?.nombre_rol || 'CIUDADANO';
  }

  trackByGrupo(index: number, grupo: GrupoSanguineo): string {
    return grupo;
  }

  private construirGrupoSanguineo(
    tipo: string | null | undefined,
    rh: string | null | undefined
  ): GrupoSanguineo | null {
    const tipoNormalizado = String(tipo || '').trim().toUpperCase();
    const rhNormalizado = String(rh || '').trim();

    const grupo = `${tipoNormalizado}${rhNormalizado}` as GrupoSanguineo;

    if (this.gruposSanguineos.includes(grupo)) {
      return grupo;
    }

    return null;
  }
}