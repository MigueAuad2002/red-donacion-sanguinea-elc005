import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Component, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService,RegisterRequest } from '../../services/auth';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmarPassword = control.get('confirmar_password')?.value;

  if (!password || !confirmarPassword) {
    return null;
  }

  return password === confirmarPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  mostrarPassword = false;
  mostrarConfirmarPassword = false;

  tiposSangre = [
    { id_sangre: 1, label: 'O+' },
    { id_sangre: 2, label: 'O-' },
    { id_sangre: 3, label: 'A+' },
    { id_sangre: 4, label: 'A-' },
    { id_sangre: 5, label: 'B+' },
    { id_sangre: 6, label: 'B-' },
    { id_sangre: 7, label: 'AB+' },
    { id_sangre: 8, label: 'AB-' }
  ];

  registerForm: FormGroup = this.fb.group(
    {
      nombre_completo: ['', [Validators.required, Validators.minLength(5)]],
      ci: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(15)]],
      fecha_nacimiento: ['', [Validators.required]],
      genero: ['', [Validators.required]],
      id_sangre: [null, [Validators.required]],
      telefono: ['', [Validators.pattern(/^[0-9+\-\s]{6,20}$/)]],
      correo: ['', [Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmar_password: ['', [Validators.required]]
    },
    {
      validators: passwordMatchValidator
    }
  );

  registrarUsuario(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Completa correctamente los datos obligatorios.';
      this.cdr.detectChanges();
      return;
    }

    const raw = this.registerForm.value;

    const payload: RegisterRequest = {
      nombre_completo: String(raw.nombre_completo || '').trim(),
      password: String(raw.password || ''),
      ci: String(raw.ci || '').trim(),
      fecha_nacimiento: String(raw.fecha_nacimiento || ''),
      genero: String(raw.genero || '').trim().toUpperCase(),
      id_sangre: Number(raw.id_sangre),
      telefono: raw.telefono ? String(raw.telefono).trim() : null,
      correo: raw.correo ? String(raw.correo).trim() : null
    };

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.register(payload)
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
            if (!res.success) {
              this.errorMessage = res.message || 'No se pudo completar el registro.';
              this.cdr.detectChanges();
              return;
            }

            this.successMessage = res.message || 'Registro de usuario exitoso.';
            this.registerForm.reset();

            setTimeout(() => {
              this.ngZone.run(() => {
                this.router.navigate(['/login']);
              });
            }, 1000);

            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error al registrar usuario:', err);
            this.errorMessage = err.error?.detail || 'Error al registrar el usuario.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  irLogin(): void {
    this.router.navigate(['/login']);
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  toggleConfirmarPassword(): void {
    this.mostrarConfirmarPassword = !this.mostrarConfirmarPassword;
  }

  get nombreCompleto() {
    return this.registerForm.controls['nombre_completo'];
  }

  get ci() {
    return this.registerForm.controls['ci'];
  }

  get fechaNacimiento() {
    return this.registerForm.controls['fecha_nacimiento'];
  }

  get genero() {
    return this.registerForm.controls['genero'];
  }

  get idSangre() {
    return this.registerForm.controls['id_sangre'];
  }

  get telefono() {
    return this.registerForm.controls['telefono'];
  }

  get correo() {
    return this.registerForm.controls['correo'];
  }

  get password() {
    return this.registerForm.controls['password'];
  }

  get confirmarPassword() {
    return this.registerForm.controls['confirmar_password'];
  }

  get passwordsNoCoinciden(): boolean {
    return (
      this.registerForm.hasError('passwordMismatch') &&
      this.confirmarPassword.touched
    );
  }

  get nombreCompletoError(): string {
    if (this.nombreCompleto.hasError('required')) {
      return 'El nombre completo es obligatorio.';
    }

    if (this.nombreCompleto.hasError('minlength')) {
      return 'El nombre debe tener al menos 5 caracteres.';
    }

    return 'Nombre inválido.';
  }

  get ciError(): string {
    if (this.ci.hasError('required')) {
      return 'El CI es obligatorio.';
    }

    if (this.ci.hasError('minlength')) {
      return 'El CI es demasiado corto.';
    }

    if (this.ci.hasError('maxlength')) {
      return 'El CI es demasiado largo.';
    }

    return 'CI inválido.';
  }

  get correoError(): string {
    if (this.correo.hasError('email')) {
      return 'Ingresa un correo válido.';
    }

    return 'Correo inválido.';
  }

  get telefonoError(): string {
    if (this.telefono.hasError('pattern')) {
      return 'Ingresa un teléfono válido.';
    }

    return 'Teléfono inválido.';
  }

  get passwordError(): string {
    if (this.password.hasError('required')) {
      return 'La contraseña es obligatoria.';
    }

    if (this.password.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    return 'Contraseña inválida.';
  }
}