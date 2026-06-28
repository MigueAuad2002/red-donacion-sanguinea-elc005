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
  templateUrl: './compatibilidad-sanguinea.html',
  styles: [`
    /* ── Flotación idle ───────────────────────────────────────────── */
    .bolsa-flotando {
      animation: bolsaFlotar 4.8s ease-in-out infinite;
      will-change: transform;
    }
    .bolsa-flotando.bolsa-bounce {
      animation: bolsaBounce 0.48s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    @keyframes bolsaFlotar {
      0%, 100% { transform: translateY(0px)   rotate(0deg); }
      50%       { transform: translateY(-9px) rotate(0.35deg); }
    }
    @keyframes bolsaBounce {
      0%   { transform: translateY(0px)  scale(1);    }
      22%  { transform: translateY(-7px) scale(1.04); }
      52%  { transform: translateY(2px)  scale(0.97); }
      78%  { transform: translateY(-2px) scale(1.01); }
      100% { transform: translateY(0px)  scale(1);    }
    }

    /* ── Anillo expansivo al hacer click ──────────────────────────── */
    .anillo-click {
      opacity: 0;
      transform: scale(0.88);
    }
    .anillo-click.activo {
      animation: anilloExpandir 0.68s ease-out forwards;
    }
    @keyframes anilloExpandir {
      0%   { opacity: 0.75; transform: scale(0.88); }
      100% { opacity: 0;    transform: scale(1.52); }
    }

    /* ── Gotas (3 escalonadas) ────────────────────────────────────── */
    .gota-s {
      opacity: 0;
      transform: translateY(0px) scaleX(1) scaleY(1);
    }
    .gota-s.cayendo {
      animation: gotaDrip 0.88s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
    }
    @keyframes gotaDrip {
      0%  { opacity: 1;   transform: translateY(0px)  scaleY(1)    scaleX(1);   }
      60% { opacity: 0.9; transform: translateY(44px) scaleY(1.08) scaleX(0.88);}
      84% { opacity: 0.6; transform: translateY(56px) scaleY(0.55) scaleX(1.55);}
      100%{ opacity: 0;   transform: translateY(61px) scaleY(0.1)  scaleX(2.2); }
    }
  `]
})
export class CompatibilidadSanguineaComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  usuario: UsuarioSesion | null = null;

  grupoUsuario: GrupoSanguineo | null = null;
  compatibilidad: CompatibilidadInfo | null = null;

  /* ── Estado animaciones ──────────────────────────────────────── */
  gotaActiva  = false;
  gotaActiva2 = false;
  gotaActiva3 = false;
  bolsaActiva  = false;   // rebote
  anilloActivo = false;   // anillo expansivo
  private activando = false;

  gruposSanguineos: GrupoSanguineo[] = [
    'O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'
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
    if (this.activando) return;
    this.activando = true;

    this.bolsaActiva  = true;
    this.anilloActivo = true;
    this.gotaActiva   = true;
    this.cdr.detectChanges();

    // Gota 2 y 3 escalonadas
    setTimeout(() => this.ngZone.run(() => {
      this.gotaActiva2 = true;
      this.cdr.detectChanges();
    }), 195);

    setTimeout(() => this.ngZone.run(() => {
      this.gotaActiva3 = true;
      this.cdr.detectChanges();
    }), 375);

    // Termina rebote + anillo
    setTimeout(() => this.ngZone.run(() => {
      this.bolsaActiva  = false;
      this.anilloActivo = false;
      this.cdr.detectChanges();
    }), 500);

    // Reset gotas
    setTimeout(() => this.ngZone.run(() => {
      this.gotaActiva = false;
      this.cdr.detectChanges();
    }), 890);

    setTimeout(() => this.ngZone.run(() => {
      this.gotaActiva2 = false;
      this.cdr.detectChanges();
    }), 1075);

    setTimeout(() => this.ngZone.run(() => {
      this.gotaActiva3  = false;
      this.activando    = false;
      this.cdr.detectChanges();
    }), 1240);
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
    const rhNormalizado   = String(rh  || '').trim();

    const grupo = `${tipoNormalizado}${rhNormalizado}` as GrupoSanguineo;

    if (this.gruposSanguineos.includes(grupo)) {
      return grupo;
    }

    return null;
  }
}