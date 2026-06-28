import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';

import { NotificacionesService,NotificacionUsuario } from '../../../services/notificaciones';

import { NotificacionWs,NotificationWsService } from '../../../services/notificaciones-ws';

type FiltroNotificacion = 'TODAS' | 'NO_LEIDO' | 'LEIDO' | 'EMERGENCIA';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notificaciones.html'
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  private notificacionesService = inject(NotificacionesService);
  private notificationWsService = inject(NotificationWsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  private wsSubscription: Subscription | null = null;

  notificaciones: NotificacionUsuario[] = [];

  filtroSeleccionado: FiltroNotificacion = 'TODAS';
  
  filtros: FiltroNotificacion[] = [
    'TODAS',
    'NO_LEIDO',
    'LEIDO',
    'EMERGENCIA'
  ];

  busqueda = '';

  isLoading = false;
  isUpdating = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.cargarNotificaciones();
    this.escucharWebSocket();
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
  }

  cargarNotificaciones(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    this.notificacionesService.obtenerNotificaciones()
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            //console.log('Notificaciones cargadas:', res);

            if (!res.success) {
              this.errorMessage = res.message || 'No se pudieron cargar las notificaciones.';
              this.cdr.detectChanges();
              return;
            }

            this.notificaciones = [...(res.notificaciones || [])];

            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error al cargar notificaciones:', err);
            this.errorMessage = err.error?.detail || 'Error al cargar las notificaciones.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  escucharWebSocket(): void {
    this.wsSubscription = this.notificationWsService.ultimaNotificacion$
      .subscribe((notificacionWs) => {
        if (!notificacionWs) {
          return;
        }

        this.agregarNotificacionWs(notificacionWs);
      });
  }

  agregarNotificacionWs(notificacionWs: NotificacionWs): void {
    this.ngZone.run(() => {
      const idNotificacion = notificacionWs.id_notificacion;

      if (idNotificacion && this.notificaciones.some(n => n.id_notificacion === idNotificacion)) {
        return;
      }

      const nuevaNotificacion: NotificacionUsuario = {
        id_notificacion: idNotificacion || Date.now(),
        titulo: notificacionWs.titulo || 'Nueva notificación',
        cuerpo: notificacionWs.cuerpo || 'Se recibió una nueva notificación.',
        tipo_referencia: notificacionWs.tipo || 'MENSAJE_WS',
        leido: notificacionWs.leido || 'NO_LEIDO',
        fecha_creacion: notificacionWs.recibido_en || new Date().toISOString(),
        nro_emergencia: notificacionWs.nro_emergencia ?? null,
        data_extra: notificacionWs.data_extra || null
      };

      this.notificaciones = [nuevaNotificacion, ...this.notificaciones];
      this.successMessage = 'Nueva notificación recibida en tiempo real.';
      this.cdr.detectChanges();

      setTimeout(() => {
        this.ngZone.run(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        });
      }, 3500);
    });
  }

  get notificacionesFiltradas(): NotificacionUsuario[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.notificaciones.filter((notificacion) => {
      const coincideTexto =
        !texto ||
        notificacion.titulo.toLowerCase().includes(texto) ||
        notificacion.cuerpo.toLowerCase().includes(texto) ||
        String(notificacion.nro_emergencia || '').includes(texto);

      const coincideFiltro =
        this.filtroSeleccionado === 'TODAS' ||
        this.filtroSeleccionado === notificacion.leido ||
        (
          this.filtroSeleccionado === 'EMERGENCIA' &&
          (
            notificacion.tipo_referencia === 'URGENCIA_SANGRE' ||
            notificacion.tipo_referencia === 'ALERTA_EMERGENCIA'
          )
        );

      return coincideTexto && coincideFiltro;
    });
  }

  get totalNotificaciones(): number {
    return this.notificaciones.length;
  }

  get totalNoLeidas(): number {
    return this.notificaciones.filter(n => n.leido === 'NO_LEIDO').length;
  }

  get totalLeidas(): number {
    return this.notificaciones.filter(n => n.leido === 'LEIDO').length;
  }

  get totalEmergencias(): number {
    return this.notificaciones.filter(n =>
      n.tipo_referencia === 'URGENCIA_SANGRE' ||
      n.tipo_referencia === 'ALERTA_EMERGENCIA'
    ).length;
  }

  cambiarFiltro(filtro: FiltroNotificacion): void {
    this.filtroSeleccionado = filtro;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroSeleccionado = 'TODAS';
  }

  marcarComoLeida(notificacion: NotificacionUsuario): void {
    if (notificacion.leido === 'LEIDO') {
      return;
    }

    if (!notificacion.id_notificacion) {
      this.errorMessage = 'La notificación no tiene un ID válido.';
      return;
    }

    this.isUpdating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.notificacionesService.marcarComoLeida(notificacion.id_notificacion)
      .pipe(
        finalize(() => {
          this.isUpdating = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            if (!res.success) {
              this.errorMessage = res.message || 'No se pudo marcar como leída.';
              this.cdr.detectChanges();
              return;
            }

            this.notificaciones = this.notificaciones.map((item) =>
              item.id_notificacion === notificacion.id_notificacion
                ? { ...item, leido: 'LEIDO' }
                : item
            );

            this.successMessage = res.message || 'Notificación marcada como leída.';
            this.cdr.detectChanges();

            setTimeout(() => {
              this.ngZone.run(() => {
                this.successMessage = '';
                this.cdr.detectChanges();
              });
            }, 3000);
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error al marcar notificación:', err);
            this.errorMessage = err.error?.detail || 'Error al marcar la notificación como leída.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  abrirReferencia(notificacion: NotificacionUsuario): void {
    if (
      notificacion.tipo_referencia === 'URGENCIA_SANGRE' ||
      notificacion.tipo_referencia === 'ALERTA_EMERGENCIA'
    ) {
      this.router.navigate(['/emergencias']);
      return;
    }
  }

  volverHome(): void {
    this.router.navigate(['/home']);
  }

  textoFiltro(filtro: FiltroNotificacion): string {
    const textos: Record<FiltroNotificacion, string> = {
      TODAS: 'Todas',
      NO_LEIDO: 'No leídas',
      LEIDO: 'Leídas',
      EMERGENCIA: 'Emergencias'
    };

    return textos[filtro];
  }

  contadorFiltro(filtro: FiltroNotificacion): number {
    const contadores: Record<FiltroNotificacion, number> = {
      TODAS: this.totalNotificaciones,
      NO_LEIDO: this.totalNoLeidas,
      LEIDO: this.totalLeidas,
      EMERGENCIA: this.totalEmergencias
    };

    return contadores[filtro];
  }

  claseFiltro(filtro: FiltroNotificacion): string {
    if (this.filtroSeleccionado === filtro) {
      return 'border-[#9B1A1A] bg-[#9B1A1A] text-white';
    }

    return 'border-[#CECECE] bg-white text-gray-700 hover:border-[#9B1A1A] hover:text-[#9B1A1A]';
  }

  claseLectura(notificacion: NotificacionUsuario): string {
    return notificacion.leido === 'NO_LEIDO'
      ? 'border-l-[#9B1A1A] bg-white'
      : 'border-l-[#DADADA] bg-[#FAFAFA]';
  }

  claseBadgeLectura(notificacion: NotificacionUsuario): string {
    return notificacion.leido === 'NO_LEIDO'
      ? 'border-[#E8BFBF] bg-[#FDF2F2] text-[#9B1A1A]'
      : 'border-gray-200 bg-gray-100 text-gray-500';
  }

  textoLectura(notificacion: NotificacionUsuario): string {
    return notificacion.leido === 'NO_LEIDO' ? 'No leída' : 'Leída';
  }

  claseTipo(notificacion: NotificacionUsuario): string {
    if (
      notificacion.tipo_referencia === 'URGENCIA_SANGRE' ||
      notificacion.tipo_referencia === 'ALERTA_EMERGENCIA'
    ) {
      return 'bg-[#9B1A1A] text-white';
    }

    return 'bg-gray-700 text-white';
  }

  textoTipo(notificacion: NotificacionUsuario): string {
    if (
      notificacion.tipo_referencia === 'URGENCIA_SANGRE' ||
      notificacion.tipo_referencia === 'ALERTA_EMERGENCIA'
    ) {
      return 'Emergencia';
    }

    return notificacion.tipo_referencia || 'Sistema';
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    if (fecha.includes('T')) {
      const date = new Date(fecha);

      if (!isNaN(date.getTime())) {
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const anio = date.getFullYear();
        const hora = String(date.getHours()).padStart(2, '0');
        const minuto = String(date.getMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
      }
    }

    const sinMilisegundos = fecha.split('.')[0];
    const partes = sinMilisegundos.split(' ');

    if (partes.length !== 2) {
      return fecha;
    }

    const fechaPartes = partes[0].split('-');
    const horaPartes = partes[1].split(':');

    if (fechaPartes.length !== 3 || horaPartes.length < 2) {
      return fecha;
    }

    return `${fechaPartes[2]}/${fechaPartes[1]}/${fechaPartes[0]} ${horaPartes[0]}:${horaPartes[1]}`;
  }

  trackByNotificacion(index: number, notificacion: NotificacionUsuario): number {
    return notificacion.id_notificacion || index;
  }
}