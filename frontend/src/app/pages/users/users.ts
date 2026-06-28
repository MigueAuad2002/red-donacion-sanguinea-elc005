import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html'
})
export class UsersComponent implements OnInit {

  private usersService = inject(UsersService);

  filtro: string = '';


  usuarios: any[] = [];
  cargando = false;

  toast: { message: string; type: 'success' | 'error' } | null = null;

  ngOnInit(): void {
    this.listarUsuarios();
  }

  get usuariosFiltrados() {
    if (!this.usuarios) return [];

    const texto = this.filtro.toLowerCase().trim();

    return this.usuarios.filter(u =>
      u.nombre_completo?.toLowerCase().includes(texto) ||
      u.ci?.toLowerCase().includes(texto)
    );
  }

  listarUsuarios(): void {
    this.cargando = true;

    this.usersService.obtenerUsuarios()
      .pipe(
        finalize(() => this.cargando = false)
      )
      .subscribe({
        next: (data) => {
          this.usuarios = data ?? [];
        },
        error: (err) => {
          console.error(err);
          this.usuarios = [];
          this.mostrarToast('Error al cargar usuarios ', 'error');
        }
      });
  }

  
  mostrarToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast = { message, type };

    setTimeout(() => {
      this.toast = null;
    }, 3000);
  }

 
  eliminarUsuario(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;

    this.usersService.eliminarUsuario(id)
      .subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.nro_usuario !== id);
          this.mostrarToast('Usuario eliminado ✔', 'success');
        },
        error: () => {
          this.mostrarToast('Error al eliminar usuario ', 'error');
        }
      });
  }
}