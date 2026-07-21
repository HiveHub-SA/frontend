import { Routes } from '@angular/router';
import { ApiarioListComponent} from './apiarios/list/list-apiarios';
import { ApiarioDetailComponent} from './apiarios/detail/detalle-apiario';
import { ColmenaDetailComponent} from './colmenas/detail/detalle-colmena';
import { MapaInteractivo } from './mapa-interactivo/mapa-interactivo';
import { App } from './app';
import { Inicio } from './inicio/inicio';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {path: 'apiarios', component: ApiarioListComponent },
  {path: 'apiarios/:id', component: ApiarioDetailComponent },
  {path: 'colmenas/:id', component: ColmenaDetailComponent },
  {path: "mapa", component: MapaInteractivo},
  {path: "inicio", component: Inicio},
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
