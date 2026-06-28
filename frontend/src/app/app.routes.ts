import { Routes } from '@angular/router';

//COMPONENTES
import { LoginComponent } from './pages/login/login';
import { HomeComponent } from './pages/home/home';
import { UsersComponent } from './pages/users/users';
// import { PerfilComponent } from './pages/perfil/perfil';

//LAYOUTS
// import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout';

//GUARDS
import { publicGuard } from './guards/public-guard';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [

  // RUTAS PÚBLICAS
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
 
  /*
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [publicGuard]
  },
  */

  // RUTAS PRIVADAS SIN SIDEBAR
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard]
  },
   {
    path: 'usuarios',
  component: UsersComponent,
  canActivate: [authGuard]
  },

  /*

  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [authGuard]
  },
  */

  /*
  RUTAS PRIVADAS CON SIDEBAR
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'donantes',
        component: ListaDonantesComponent
      },
      {
        path: 'solicitudes',
        component: ListaSolicitudesComponent
      },
      {
        path: 'emparejamientos',
        component: EmparejamientosComponent
      },
      {
        path: 'notificaciones',
        component: NotificacionesComponent
      },
      {
        path: 'reportes',
        component: ReportesComponent
      }
    ]
  },
  */

  //FALLBACK
  {
    path: '**',
    redirectTo: 'login'
  }
];