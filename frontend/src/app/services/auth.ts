import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioSesion {
  nro_usuario: number;
  nombre_completo: string;
  tipo_sangre: string;
  factor_rh: string;
  genero: string;
  fecha_nacimiento: string;
  nombre_rol: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  usuario: UsuarioSesion;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private baseUrl = environment.apiUrl.replace(/\/$/, '');
  private apiUrl = `${this.baseUrl}/auth`;

  login(credentials: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  guardarSesion(token: string, usuario: UsuarioSesion): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(usuario));
  }

  logout(): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    return localStorage.getItem('token');
  }

  getUser(): UsuarioSesion | null {
    if (!this.isBrowser()) {
      return null;
    }

    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as UsuarioSesion;
    } catch {
      this.logout();
      return null;
    }
  }

  getRol(): string {
    const usuario = this.getUser();
    return usuario?.nombre_rol?.trim().toUpperCase() || '';
  }

  getNombreCompleto(): string {
    const usuario = this.getUser();
    return usuario?.nombre_completo || 'Usuario';
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !this.tokenExpirado();
  }

  tokenExpirado(): boolean {
    const token = this.getToken();

    if (!token) {
      return true;
    }

    try {
      const payloadBase64 = token.split('.')[1];

      if (!payloadBase64) {
        return true;
      }

      const payload = JSON.parse(atob(payloadBase64));
      const fechaExpiracion = payload.exp * 1000;
      const fechaActual = Date.now();

      return fechaActual >= fechaExpiracion;
    } catch {
      return true;
    }
  }

  limpiarSesionSiTokenExpirado(): boolean {
    if (this.tokenExpirado()) {
      this.logout();
      return true;
    }

    return false;
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}