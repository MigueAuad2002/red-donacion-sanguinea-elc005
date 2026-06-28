import { Injectable, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';


export type WsStatus = 'DESCONECTADO' | 'CONECTANDO' | 'CONECTADO' | 'ERROR';

export interface NotificacionWs {
  id_notificacion?: number;
  tipo: string;
  titulo: string;
  cuerpo: string;
  nro_emergencia?: number | null;
  leido?: string;
  data_extra?: any;
  recibido_en: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationWsService {
  private platformId = inject(PLATFORM_ID);

  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manualClose = false;
  private reconnectAttempts = 0;
  private ngZone = inject(NgZone);

  private statusSubject = new BehaviorSubject<WsStatus>('DESCONECTADO');
  status$ = this.statusSubject.asObservable();

  private ultimaNotificacionSubject = new BehaviorSubject<NotificacionWs | null>(null);
  ultimaNotificacion$ = this.ultimaNotificacionSubject.asObservable();

  private notificacionesSubject = new BehaviorSubject<NotificacionWs[]>([]);
  notificaciones$ = this.notificacionesSubject.asObservable();

  connect(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      this.statusSubject.next('DESCONECTADO');
      return;
    }

    this.clearReconnectTimer();
    this.manualClose = false;
    this.statusSubject.next('CONECTANDO');

    const wsUrl = this.buildWsUrl(token);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.ngZone.run(() => {
          console.log('WebSocket conectado');
          this.reconnectAttempts = 0;
          this.statusSubject.next('CONECTADO');
        });
      };

      this.socket.onmessage = (event) => {
        this.ngZone.run(() => {
          this.handleMessage(event.data);
        });
      };

      this.socket.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('Error WebSocket:', error);
          this.statusSubject.next('ERROR');
        });
      };

      this.socket.onclose = () => {
        this.ngZone.run(() => {
          console.warn('WebSocket cerrado');
          this.socket = null;

          if (!this.manualClose && localStorage.getItem('token')) {
            this.scheduleReconnect();
            return;
          }

          this.statusSubject.next('DESCONECTADO');
        });
      };
    
    } catch (error) {
      console.error('No se pudo abrir WebSocket:', error);
      this.statusSubject.next('ERROR');
      this.scheduleReconnect();
    }
  }

  reconnect(): void {
    this.clearReconnectTimer();
    this.manualClose = true;

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
    this.statusSubject.next('DESCONECTADO');

    setTimeout(() => {
      this.manualClose = false;
      this.connect();
    }, 300);
  }

  disconnect(): void {
    this.manualClose = true;
    this.clearReconnectTimer();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.statusSubject.next('DESCONECTADO');
  }

  limpiarNotificaciones(): void {
    this.notificacionesSubject.next([]);
    this.ultimaNotificacionSubject.next(null);
  }

  private handleMessage(rawData: any): void {
    let data: any;

    try {
      data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch {
      data = {
        tipo: 'MENSAJE_WS',
        titulo: 'Mensaje recibido',
        cuerpo: String(rawData)
      };
    }

    const notificacion: NotificacionWs = {
      id_notificacion: data?.id_notificacion,
      tipo: data?.tipo || 'MENSAJE_WS',
      titulo: data?.titulo || 'Notificación',
      cuerpo: data?.cuerpo || 'Se recibió una notificación del sistema.',
      nro_emergencia: data?.nro_emergencia ?? null,
      leido: data?.leido || 'NO_LEIDO',
      data_extra: data?.data_extra || null,
      recibido_en: new Date().toISOString()
    };

    console.log('Notificación WS recibida:', notificacion);

    const actuales = this.notificacionesSubject.value;
    this.notificacionesSubject.next([notificacion, ...actuales]);

    this.ultimaNotificacionSubject.next(notificacion);
  }

  private scheduleReconnect(): void {
    this.statusSubject.next('ERROR');

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;

    this.clearReconnectTimer();

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private buildWsUrl(token: string): string {
    const apiUrl = environment.apiUrl.replace(/\/$/, '');

    const wsBaseUrl = apiUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://');

    return `${wsBaseUrl}/notif/ws?token=${encodeURIComponent(token)}`;
  }
}