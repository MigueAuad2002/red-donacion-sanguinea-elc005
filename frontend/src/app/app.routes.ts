import { Routes } from '@angular/router';

// COMPONENTES
import { LoginComponent } from './pages/login/login';
import { HomeComponent } from './pages/home/home';
import { PerfilComponent } from './pages/perfil/perfil';
import { EmergenciasListaComponent } from './pages/emergencias/emergencias-lista/emergencias-lista';
import { EmergenciasMapaComponent } from './pages/emergencias/emergencias-mapa/emergencias-mapa';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones/notificaciones';
import { HospitalesComponent } from './pages/hospitales/hospitales';

//LAYOUTS
import { PrivateLayoutComponent } from './layouts/private-layout/private-layout';

//GUARDS
import { publicGuard } from './guards/public-guard';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [

  //RUTA INICIAL
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  //RUTAS PÚBLICAS
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

  //RUTAS PRIVADAS CON LAYOUT GLOBAL
  {
    path: '',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        component: HomeComponent
      },
      {
        path: 'perfil',
        component: PerfilComponent
      },
      {
        path: 'emergencias',
        component: EmergenciasListaComponent
      },
      {
        path: 'emergencias/mapa',
        component: EmergenciasMapaComponent
      },
      {
        path: 'notificaciones',
        component: NotificacionesComponent
      },
      {
        path: 'hospitales',
        component: HospitalesComponent
      },

      /*
      Más adelante puedes agregar aquí:
      {
        path: 'usuarios',
        component: UsuariosComponent
      },
      
      {
        path: 'notificaciones',
        component: NotificacionesComponent
      }
      */
    ]
  },

  //FALLBACK
  {
    path: '**',
    redirectTo: 'login'
  }
];