import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

interface ModuloSistema {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  rolesPermitidos: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html'
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  usuarioActual: any = null;
  nombreUsuario = 'Usuario';
  rolUsuario = '';
  modulosFiltrados: ModuloSistema[] = [];

  modulos: ModuloSistema[] = [
    {
      titulo: 'Seguridad y Usuarios',
      descripcion: 'Gestión de usuarios, roles, permisos y accesos al sistema.',
      icono: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z M19 8v6 M16 11h6',
      ruta: '/usuarios',
      rolesPermitidos: ['ADMINISTRADOR']
    },
    {
      titulo: 'Emergencias',
      descripcion: 'Registro y seguimiento de solicitudes urgentes de sangre.',
      icono: 'M12 9v4m0 4h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
      ruta: '/emergencias',
      rolesPermitidos: ['ADMINISTRADOR', 'OPERADOR', 'HOSPITAL']
    },
    {
      titulo: 'Hospitales',
      descripcion: 'Administración de hospitales, bancos de sangre y centros asociados.',
      icono: 'M3 21h18 M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14 M9 21v-6h6v6 M10 9h4 M12 7v4',
      ruta: '/hospitales',
      rolesPermitidos: ['ADMINISTRADOR', 'OPERADOR']
    },
    {
      titulo: 'Perfil',
      descripcion: 'Consulta y actualización de los datos personales del usuario.',
      icono: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z',
      ruta: '/perfil',
      rolesPermitidos: ['*']
    }
  ];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.usuarioActual = this.authService.getUser();

    if (!this.usuarioActual || this.authService.tokenExpirado()) {
      this.cerrarSesion();
      return;
    }

    this.nombreUsuario = this.obtenerNombreUsuario();
    this.rolUsuario = this.obtenerRolUsuario();

    this.modulosFiltrados = this.modulos.filter((modulo) =>
      modulo.rolesPermitidos.includes('*') ||
      modulo.rolesPermitidos.includes(this.rolUsuario)
    );
  }

  obtenerNombreUsuario(): string {
    const nombreCompleto =
      this.usuarioActual?.nombre_completo ||
      `${this.usuarioActual?.nombre || ''} ${this.usuarioActual?.apellido || ''}`.trim();

    return nombreCompleto || this.usuarioActual?.ci || 'Usuario';
  }

  obtenerRolUsuario(): string {
    const rol =
      this.usuarioActual?.rol ||
      this.usuarioActual?.nombre_rol ||
      this.usuarioActual?.role ||
      '';

    return String(rol).trim().toUpperCase();
  }

  navegarA(ruta: string): void {
    this.router.navigateByUrl(ruta);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}