import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PerfilUsuario {
  nro_usuario: number;
  nombre_completo: string;
  ci: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string | null;
  correo: string | null;
  estado: boolean;
  fecha_registro: string;
  nombre_rol: string;
  tipo_sangre: string;
  factor_rh: string;
}

export interface PerfilResponse {
  success: boolean;
  perfil: PerfilUsuario;
  message?: string;
}

export interface ActualizarPerfilRequest {
  telefono?: string | null;
  correo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);

  private baseUrl = environment.apiUrl.replace(/\/$/, '');
  private apiUrl = `${this.baseUrl}/profile`;

  obtenerPerfil(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(this.apiUrl);
  }

  actualizarPerfil(data: ActualizarPerfilRequest): Observable<PerfilResponse> {
    return this.http.put<PerfilResponse>(this.apiUrl, data);
  }
}