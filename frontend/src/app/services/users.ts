import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

export interface Usuario {
  nro_usuario: number;
  nombre_completo: string;
  ci: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string | null;
  correo: string;
  estado: boolean;
  nombre_rol: string;
  tipo_sangre: string;
  factor_rh: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private baseUrl = environment.apiUrl.replace(/\/$/, '');
  private apiUrl = `${this.baseUrl}/users`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`
    });
  }

// LISTAR
obtenerUsuarios(): Observable<Usuario[]> {
  return this.http.get<Usuario[]>(
    this.apiUrl,
    { headers: this.getHeaders() }
  );
}

// UNO
obtenerUsuario(id: number): Observable<Usuario> {
  return this.http.get<Usuario>(
    `${this.apiUrl}/${id}`,
    { headers: this.getHeaders() }
  );
}

// CREAR
crearUsuario(data: any): Observable<any> {
  return this.http.post(
    this.apiUrl,
    data,
    { headers: this.getHeaders() }
  );
}

// ACTUALIZAR
actualizarUsuario(id: number, data: any): Observable<any> {
  return this.http.put(
    `${this.apiUrl}/${id}`,
    data,
    { headers: this.getHeaders() }
  );
}

// ELIMINAR
eliminarUsuario(id: number): Observable<any> {
  return this.http.delete(
    `${this.apiUrl}/${id}`,
    { headers: this.getHeaders() }
  );
}
}