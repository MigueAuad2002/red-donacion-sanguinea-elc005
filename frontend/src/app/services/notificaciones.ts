import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificacionUsuario {
  id_notificacion: number;
  titulo: string;
  cuerpo: string;
  tipo_referencia: string;
  leido: 'LEIDO' | 'NO_LEIDO' | string;
  fecha_creacion: string;
  nro_emergencia: number | null;
  data_extra?: any;
}

export interface NotificacionesResponse {
  success: boolean;
  notificaciones: NotificacionUsuario[];
  message?: string;
}

export interface MarcarLeidoResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private http = inject(HttpClient);

  private baseUrl = environment.apiUrl.replace(/\/$/, '');
  private apiUrl = `${this.baseUrl}/notif`;

  obtenerNotificaciones(): Observable<NotificacionesResponse> {
    return this.http.get<NotificacionesResponse>(`${this.apiUrl}/`);
  }

  marcarComoLeida(idNotificacion: number): Observable<MarcarLeidoResponse> {
    return this.http.put<MarcarLeidoResponse>(
      `${this.apiUrl}/${idNotificacion}/marcar-leido`,
      {}
    );
  }
}