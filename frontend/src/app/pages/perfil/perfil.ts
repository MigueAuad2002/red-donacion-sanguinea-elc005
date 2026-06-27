import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ProfileService } from '../../services/perfil';

interface PerfilUsuario {
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

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.html'
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  perfil: PerfilUsuario | null = null;

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  perfilForm: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.pattern(/^[0-9+\-\s]{6,20}$/)]]
  });

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.perfil = null;

    this.profileService.obtenerPerfil()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          console.log('Perfil recibido:', res);

          if (!res || res.success !== true || !res.perfil) {
            this.errorMessage = res?.message || 'No se pudo cargar el perfil.';
            return;
          }

          this.perfil = res.perfil;

          this.perfilForm.patchValue({
            correo: this.perfil?.correo || '',
            telefono: this.perfil?.telefono || ''
          });

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cargando perfil:', err);
          this.errorMessage = err.error?.detail || 'Error al cargar el perfil.';
          this.cdr.detectChanges();
        }
      });
  }

  guardarCambios(): void {
    if (this.perfilForm.invalid || !this.perfil) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    const correoNuevo = String(this.perfilForm.value.correo || '').trim();
    const telefonoNuevo = String(this.perfilForm.value.telefono || '').trim();

    const payload: any = {};

    if (correoNuevo !== (this.perfil.correo || '')) {
      payload.correo = correoNuevo;
    }

    if (telefonoNuevo !== (this.perfil.telefono || '')) {
      payload.telefono = telefonoNuevo || null;
    }

    if (Object.keys(payload).length === 0) {
      this.successMessage = 'No hay cambios para guardar.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.profileService.actualizarPerfil(payload)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          console.log('Perfil actualizado:', res);

          if (!res || res.success !== true) {
            this.errorMessage = res?.message || 'No se pudo actualizar el perfil.';
            return;
          }

          if (res.perfil) {
            this.perfil = res.perfil;
          } else {
            this.perfil = {
              ...this.perfil!,
              correo: payload.correo !== undefined ? payload.correo : this.perfil!.correo,
              telefono: payload.telefono !== undefined ? payload.telefono : this.perfil!.telefono
            };
          }

          this.perfilForm.patchValue({
            correo: this.perfil?.correo || '',
            telefono: this.perfil?.telefono || ''
          });

          this.successMessage = res.message || 'Perfil actualizado correctamente.';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error actualizando perfil:', err);
          this.errorMessage = err.error?.detail || 'Error al actualizar el perfil.';
          this.cdr.detectChanges();
        }
      });
  }

  volverHome(): void {
    this.router.navigate(['/home']);
  }

  get correo() {
    return this.perfilForm.controls['correo'];
  }

  get telefono() {
    return this.perfilForm.controls['telefono'];
  }

  get correoError(): string {
    if (this.correo.hasError('required')) {
      return 'El correo es obligatorio.';
    }

    if (this.correo.hasError('email')) {
      return 'Ingresa un correo válido.';
    }

    return '';
  }

  get telefonoError(): string {
    if (this.telefono.hasError('pattern')) {
      return 'Ingresa un teléfono válido.';
    }

    return '';
  }

  obtenerInicial(): string {
    return this.perfil?.nombre_completo?.trim()?.charAt(0) || 'U';
  }

  grupoSanguineo(): string {
    if (!this.perfil) {
      return 'No registrado';
    }

    return `${this.perfil.tipo_sangre || ''}${this.perfil.factor_rh || ''}` || 'No registrado';
  }

  formatearGenero(genero: string | null | undefined): string {
    const valor = String(genero || '').toUpperCase();

    if (valor === 'M') {
      return 'Masculino';
    }

    if (valor === 'F') {
      return 'Femenino';
    }

    return 'No registrado';
  }

  formatearEstado(estado: boolean | null | undefined): string {
    return estado ? 'Activo' : 'Inactivo';
  }

  formatearFechaSimple(fecha: string | null | undefined): string {
    if (!fecha) {
      return 'No registrado';
    }

    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  formatearFechaRegistro(fecha: string | null | undefined): string {
    if (!fecha) {
      return 'No registrado';
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
}