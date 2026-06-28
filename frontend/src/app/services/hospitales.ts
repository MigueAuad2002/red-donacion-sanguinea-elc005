import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Hospital {
  nro_hospital: number;
  nombre_hospital: string;
  direccion: string;
  latitud: number;
  longitud: number;
  fecha_creacion: string;
}

export interface HospitalRequest {
  nombre_hospital: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

export interface HospitalesResponse {
  success: boolean;
  total: number;
  hospitales: Hospital[];
  message?: string;
}

export interface HospitalResponse {
  success: boolean;
  hospital: Hospital;
  message?: string;
}

export interface HospitalCreateResponse {
  success: boolean;
  message: string;
  nro_hospital: number;
}

export interface HospitalActionResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class HospitalesService {
  private http = inject(HttpClient);

  private baseUrl = environment.apiUrl.replace(/\/$/, '');
  private apiUrl = `${this.baseUrl}/hospitales`;

  obtenerHospitales(): Observable<HospitalesResponse> {
    return this.http.get<HospitalesResponse>(`${this.apiUrl}/`);
  }

  obtenerHospital(nroHospital: number): Observable<HospitalResponse> {
    return this.http.get<HospitalResponse>(`${this.apiUrl}/${nroHospital}`);
  }

  crearHospital(data: HospitalRequest): Observable<HospitalCreateResponse> {
    return this.http.post<HospitalCreateResponse>(`${this.apiUrl}/`, data);
  }

  actualizarHospital(nroHospital: number, data: HospitalRequest): Observable<HospitalActionResponse> {
    return this.http.put<HospitalActionResponse>(`${this.apiUrl}/${nroHospital}`, data);
  }

  eliminarHospital(nroHospital: number): Observable<HospitalActionResponse> {
    return this.http.delete<HospitalActionResponse>(`${this.apiUrl}/${nroHospital}`);
  }
}