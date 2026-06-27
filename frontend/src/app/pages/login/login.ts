import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      ci: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required]]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (!res.success || !res.token || !res.usuario) {
            this.errorMessage = res.message || 'No se pudo iniciar sesión.';
            return;
          }

          this.authService.guardarSesion(res.token, res.usuario);

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          if (err.status === 0) {
            this.errorMessage = 'No se pudo conectar con el servidor.';
            return;
          }

          if (err.status === 401 || err.status === 400) {
            this.errorMessage = err.error?.detail || 'CI o contraseña incorrectos.';
            return;
          }

          this.errorMessage = err.error?.detail || 'Ocurrió un error al iniciar sesión.';
        }
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  get ci() {
    return this.loginForm.controls['ci'];
  }

  get password() {
    return this.loginForm.controls['password'];
  }

  get ciError(): string {
    if (this.ci.hasError('required')) {
      return 'Ingresa tu carnet de identidad.';
    }

    if (this.ci.hasError('minlength')) {
      return 'El CI debe tener al menos 5 caracteres.';
    }

    return '';
  }

  get passwordError(): string {
    if (this.password.hasError('required')) {
      return 'Ingresa tu contraseña.';
    }

    return '';
  }
}