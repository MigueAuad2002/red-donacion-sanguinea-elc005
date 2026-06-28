import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  NgZone
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth';
import {
  Hospital,
  HospitalRequest,
  HospitalesService
} from '../../services/hospitales';

import {
  MapaUbicacionesComponent,
  CoordenadasSeleccionadas
} from '../../shared/components/mapa-ubicaciones/mapa-ubicaciones';

type ModoFormulario = 'CREAR' | 'EDITAR';

@Component({
  selector: 'app-hospitales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MapaUbicacionesComponent
  ],
  templateUrl: './hospitales.html'
})
export class HospitalesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private hospitalesService = inject(HospitalesService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  @ViewChild('formularioHospital')
  formularioHospital?: ElementRef<HTMLElement>;

  hospitales: Hospital[] = [];

  busqueda = '';
  rolUsuario = '';

  isLoading = false;
  isSaving = false;
  isDeleting = false;

  errorMessage = '';
  successMessage = '';

  mostrarFormulario = false;
  mostrarMapaFormulario = false;

  modoFormulario: ModoFormulario = 'CREAR';
  hospitalSeleccionado: Hospital | null = null;

  hospitalForm: FormGroup = this.fb.group({
    nombre_hospital: ['', [Validators.required, Validators.minLength(3)]],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
    latitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]]
  });

  ngOnInit(): void {
    this.rolUsuario = this.authService.getRol();
    this.cargarHospitales();
  }

  cargarHospitales(limpiarMensajes: boolean = true): void {
    this.isLoading = true;

    if (limpiarMensajes) {
      this.errorMessage = '';
      this.successMessage = '';
    }

    this.cdr.detectChanges();

    this.hospitalesService.obtenerHospitales()
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
            console.log('Hospitales cargados:', res);

            if (!res.success) {
              this.errorMessage = res.message || 'No se pudieron cargar los hospitales.';
              this.cdr.detectChanges();
              return;
            }

            this.hospitales = [...(res.hospitales || [])];
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error al cargar hospitales:', err);
            this.errorMessage = err.error?.detail || 'Error al cargar los hospitales.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  get esAdministrador(): boolean {
    return this.rolUsuario === 'ADMINISTRADOR';
  }

  get hospitalesFiltrados(): Hospital[] {
    const texto = this.busqueda.trim().toLowerCase();

    if (!texto) {
      return this.hospitales;
    }

    return this.hospitales.filter((hospital) =>
      String(hospital.nro_hospital || '').includes(texto) ||
      String(hospital.nombre_hospital || '').toLowerCase().includes(texto) ||
      String(hospital.direccion || '').toLowerCase().includes(texto) ||
      String(hospital.latitud || '').includes(texto) ||
      String(hospital.longitud || '').includes(texto)
    );
  }

  get totalHospitales(): number {
    return this.hospitales.length;
  }

  get totalConUbicacion(): number {
    return this.hospitales.filter(h =>
      h.latitud !== null &&
      h.latitud !== undefined &&
      h.longitud !== null &&
      h.longitud !== undefined
    ).length;
  }

  get totalSinUbicacion(): number {
    return this.hospitales.filter(h =>
      h.latitud === null ||
      h.latitud === undefined ||
      h.longitud === null ||
      h.longitud === undefined
    ).length;
  }

  get formularioTitulo(): string {
    return this.modoFormulario === 'CREAR'
      ? 'Registrar hospital'
      : 'Editar hospital';
  }

  get formularioDescripcion(): string {
    return this.modoFormulario === 'CREAR'
      ? 'Completa los datos básicos y selecciona la ubicación en el mapa.'
      : 'Actualiza los datos del hospital y ajusta su ubicación si corresponde.';
  }

  get textoBotonGuardar(): string {
    return this.modoFormulario === 'CREAR'
      ? 'Guardar hospital'
      : 'Actualizar hospital';
  }

  get coordenadasFormularioValidas(): boolean {
    const lat = Number(this.latitud.value);
    const lng = Number(this.longitud.value);

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !(lat === 0 && lng === 0)
    );
  }

  get coordenadasFormularioTexto(): string {
    if (!this.coordenadasFormularioValidas) {
      return 'Selecciona una ubicación en el mapa.';
    }

    return `${this.latitud.value}, ${this.longitud.value}`;
  }

  abrirCrear(): void {
    if (!this.esAdministrador) {
      return;
    }

    this.modoFormulario = 'CREAR';
    this.hospitalSeleccionado = null;
    this.mostrarFormulario = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.hospitalForm.reset({
      nombre_hospital: '',
      direccion: '',
      latitud: '',
      longitud: ''
    });

    this.reiniciarMapaFormulario();
    this.enfocarFormulario();
    this.cdr.detectChanges();
  }

  abrirEditar(hospital: Hospital): void {
    if (!this.esAdministrador) {
      return;
    }

    this.modoFormulario = 'EDITAR';
    this.hospitalSeleccionado = hospital;
    this.mostrarFormulario = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.hospitalForm.patchValue({
      nombre_hospital: hospital.nombre_hospital || '',
      direccion: hospital.direccion || '',
      latitud: hospital.latitud,
      longitud: hospital.longitud
    });

    this.reiniciarMapaFormulario();
    this.enfocarFormulario();
    this.cdr.detectChanges();
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.mostrarMapaFormulario = false;
    this.hospitalSeleccionado = null;
    this.hospitalForm.reset();
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  actualizarCoordenadasDesdeMapa(coords: CoordenadasSeleccionadas): void {
    if (!coords || coords.latitud === 0 || coords.longitud === 0) {
      return;
    }

    this.hospitalForm.patchValue({
      latitud: coords.latitud,
      longitud: coords.longitud
    });

    this.latitud.markAsTouched();
    this.longitud.markAsTouched();

    this.cdr.detectChanges();
  }

  guardarHospital(): void {
    if (!this.esAdministrador) {
      this.errorMessage = 'No tienes permisos para realizar esta acción.';
      this.cdr.detectChanges();
      return;
    }

    if (this.hospitalForm.invalid) {
      this.hospitalForm.markAllAsTouched();
      this.errorMessage = 'Completa los datos requeridos antes de guardar.';
      this.cdr.detectChanges();
      return;
    }

    const raw = this.hospitalForm.value;

    const payload: HospitalRequest = {
      nombre_hospital: String(raw.nombre_hospital || '').trim(),
      direccion: String(raw.direccion || '').trim(),
      latitud: Number(raw.latitud),
      longitud: Number(raw.longitud)
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    if (this.modoFormulario === 'CREAR') {
      this.crearHospital(payload);
      return;
    }

    this.actualizarHospital(payload);
  }

  private crearHospital(payload: HospitalRequest): void {
    this.hospitalesService.crearHospital(payload)
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.isSaving = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            if (!res.success) {
              this.errorMessage = res.message || 'No se pudo registrar el hospital.';
              this.cdr.detectChanges();
              return;
            }

            this.successMessage = res.message || 'Hospital registrado correctamente.';
            this.mostrarFormulario = false;
            this.mostrarMapaFormulario = false;
            this.hospitalSeleccionado = null;

            this.hospitalForm.reset({
              nombre_hospital: '',
              direccion: '',
              latitud: '',
              longitud: ''
            });

            this.cargarHospitales(false);
            this.limpiarMensajeExito();
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error al crear hospital:', err);
            this.errorMessage = err.error?.detail || 'Error al registrar el hospital.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  private actualizarHospital(payload: HospitalRequest): void {
    if (!this.hospitalSeleccionado) {
      this.errorMessage = 'No hay hospital seleccionado para actualizar.';
      this.isSaving = false;
      this.cdr.detectChanges();
      return;
    }

    const nroHospital = this.hospitalSeleccionado.nro_hospital;

    this.hospitalesService.actualizarHospital(nroHospital, payload)
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.isSaving = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            if (!res.success) {
              this.errorMessage = res.message || 'No se pudo actualizar el hospital.';
              this.cdr.detectChanges();
              return;
            }

            this.hospitales = this.hospitales.map((hospital) =>
              hospital.nro_hospital === nroHospital
                ? {
                    ...hospital,
                    nombre_hospital: payload.nombre_hospital,
                    direccion: payload.direccion,
                    latitud: payload.latitud,
                    longitud: payload.longitud
                  }
                : hospital
            );

            this.successMessage = res.message || 'Hospital actualizado correctamente.';
            this.mostrarFormulario = false;
            this.mostrarMapaFormulario = false;
            this.hospitalSeleccionado = null;

            this.hospitalForm.reset({
              nombre_hospital: '',
              direccion: '',
              latitud: '',
              longitud: ''
            });

            this.limpiarMensajeExito();
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error al actualizar hospital:', err);
            this.errorMessage = err.error?.detail || 'Error al actualizar el hospital.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  eliminarHospital(hospital: Hospital): void {
    if (!this.esAdministrador) {
      this.errorMessage = 'No tienes permisos para eliminar hospitales.';
      this.cdr.detectChanges();
      return;
    }

    const confirmado = confirm(
      `¿Seguro que deseas eliminar el hospital "${hospital.nombre_hospital}"?\n\nEsta acción puede afectar su inventario sanguíneo relacionado.`
    );

    if (!confirmado) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    this.hospitalesService.eliminarHospital(hospital.nro_hospital)
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.isDeleting = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            if (!res.success) {
              this.errorMessage = res.message || 'No se pudo eliminar el hospital.';
              this.cdr.detectChanges();
              return;
            }

            this.hospitales = this.hospitales.filter(
              item => item.nro_hospital !== hospital.nro_hospital
            );

            if (this.hospitalSeleccionado?.nro_hospital === hospital.nro_hospital) {
              this.cancelarFormulario();
            }

            this.successMessage = res.message || 'Hospital eliminado correctamente.';
            this.limpiarMensajeExito();
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error al eliminar hospital:', err);
            this.errorMessage = err.error?.detail || 'Error al eliminar el hospital.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.cdr.detectChanges();
  }

  volverHome(): void {
    this.router.navigate(['/home']);
  }

  abrirMapaHospital(hospital: Hospital): void {
    const lat = Number(hospital.latitud);
    const lng = Number(hospital.longitud);

    if (isNaN(lat) || isNaN(lng)) {
      this.errorMessage = 'El hospital no tiene coordenadas válidas.';
      this.cdr.detectChanges();
      return;
    }

    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }

  copiarCoordenadas(hospital: Hospital): void {
    const texto = `${hospital.latitud}, ${hospital.longitud}`;

    if (!navigator?.clipboard) {
      this.successMessage = texto;
      this.cdr.detectChanges();
      return;
    }

    navigator.clipboard.writeText(texto).then(() => {
      this.ngZone.run(() => {
        this.successMessage = 'Coordenadas copiadas.';
        this.limpiarMensajeExito();
        this.cdr.detectChanges();
      });
    });
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return 'Sin fecha';
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

  trackByHospital(index: number, hospital: Hospital): number {
    return hospital.nro_hospital || index;
  }

  get nombreHospital() {
    return this.hospitalForm.controls['nombre_hospital'];
  }

  get direccion() {
    return this.hospitalForm.controls['direccion'];
  }

  get latitud() {
    return this.hospitalForm.controls['latitud'];
  }

  get longitud() {
    return this.hospitalForm.controls['longitud'];
  }

  private reiniciarMapaFormulario(): void {
    this.mostrarMapaFormulario = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.ngZone.run(() => {
        this.mostrarMapaFormulario = true;
        this.cdr.detectChanges();
      });
    }, 0);
  }

  private enfocarFormulario(): void {
    setTimeout(() => {
      this.formularioHospital?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 120);
  }

  private limpiarMensajeExito(): void {
    setTimeout(() => {
      this.ngZone.run(() => {
        this.successMessage = '';
        this.cdr.detectChanges();
      });
    }, 3000);
  }
}