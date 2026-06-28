import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { NotificationWsService } from '../../../services/notificaciones-ws';

@Component({
  selector: 'app-ws-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ws-status.html'
})
export class WsStatusComponent implements OnInit, OnDestroy {
  private notificationWsService = inject(NotificationWsService);
  private router = inject(Router);

  private subscriptions: Subscription[] = [];

  status = 'DESCONECTADO';
  menuAbierto = false;
  tieneNuevaNotificacion = false;

  ngOnInit(): void {
    const statusSub = this.notificationWsService.status$.subscribe((status) => {
      this.status = status;
    });

    const notificacionSub = this.notificationWsService.ultimaNotificacion$.subscribe((notificacion) => {
      if (!notificacion) {
        return;
      }

      this.tieneNuevaNotificacion = true;
    });

    this.subscriptions.push(statusSub, notificacionSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('document:click')
  cerrarMenuDesdeFuera(): void {
    if (this.menuAbierto) {
      this.menuAbierto = false;
    }
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuAbierto = !this.menuAbierto;

    if (this.menuAbierto) {
      this.tieneNuevaNotificacion = false;
    }
  }

  abrirNotificaciones(event: MouseEvent): void {
    event.stopPropagation();
    this.menuAbierto = false;
    this.tieneNuevaNotificacion = false;
    this.router.navigate(['/notificaciones']);
  }

  reintentarConexion(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationWsService.reconnect();
  }

  get estaConectado(): boolean {
    return this.status === 'CONECTADO';
  }

  get estaConectando(): boolean {
    return this.status === 'CONECTANDO';
  }

  get estaEnError(): boolean {
    return this.status === 'ERROR' || this.status === 'DESCONECTADO';
  }

  get textoEstado(): string {
    const estados: Record<string, string> = {
      CONECTADO: 'WebSocket conectado',
      CONECTANDO: 'Conectando...',
      DESCONECTADO: 'WebSocket desconectado',
      ERROR: 'Error de conexión'
    };

    return estados[this.status] || this.status;
  }

  get descripcionEstado(): string {
    if (this.status === 'CONECTADO') {
      return 'Recibirás alertas en tiempo real.';
    }

    if (this.status === 'CONECTANDO') {
      return 'Intentando establecer conexión.';
    }

    return 'No se están recibiendo alertas en vivo.';
  }

  get claseEstadoDot(): string {
    if (this.status === 'CONECTADO') {
      return 'bg-green-500';
    }

    if (this.status === 'CONECTANDO') {
      return 'bg-amber-500';
    }

    return 'bg-[#9B1A1A]';
  }

  get claseBotonPrincipal(): string {
    if (this.status === 'CONECTADO') {
      return 'border-green-200 bg-white text-green-700 shadow-green-900/10';
    }

    if (this.status === 'CONECTANDO') {
      return 'border-amber-200 bg-white text-amber-700 shadow-amber-900/10';
    }

    return 'border-[#E8BFBF] bg-white text-[#9B1A1A] shadow-red-900/10';
  }
}