import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationWsService, WsStatus } from '../../../services/notificaciones-ws';

@Component({
  selector: 'app-ws-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ws-status.html'
})
export class WsStatusComponent {
  wsService = inject(NotificationWsService);

  status$ = this.wsService.status$;
  ultimaNotificacion$ = this.wsService.ultimaNotificacion$;

  modoDiscreto = false;

  reintentar(): void {
    this.wsService.reconnect();
  }

  alternarModoDiscreto(): void {
    this.modoDiscreto = !this.modoDiscreto;
  }

  textoEstado(status: WsStatus): string {
    const textos: Record<WsStatus, string> = {
      CONECTADO: 'Socket Activo',
      CONECTANDO: 'Conectando Socket',
      DESCONECTADO: 'Socket Desconectado',
      ERROR: 'Socket sin Conexión'
    };

    return textos[status];
  }

  clasePunto(status: WsStatus): string {
    const clases: Record<WsStatus, string> = {
      CONECTADO: 'bg-green-600',
      CONECTANDO: 'bg-amber-500 animate-pulse',
      DESCONECTADO: 'bg-gray-400',
      ERROR: 'bg-[#9B1A1A]'
    };

    return clases[status];
  }

  claseCaja(status: WsStatus): string {
    const clases: Record<WsStatus, string> = {
      CONECTADO: 'border-green-200 bg-green-50 text-green-800',
      CONECTANDO: 'border-amber-200 bg-amber-50 text-amber-800',
      DESCONECTADO: 'border-gray-200 bg-white text-gray-700',
      ERROR: 'border-[#E8BFBF] bg-[#FDF2F2] text-[#7A1A1A]'
    };

    return clases[status];
  }

  mostrarBotonReintentar(status: WsStatus): boolean {
    return status === 'ERROR' || status === 'DESCONECTADO';
  }
}