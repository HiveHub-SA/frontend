import { Routes } from '@angular/router';
import { ApiarioListComponent } from './apiarios/list/list-apiarios';
import { ApiarioDetailComponent } from './apiarios/detail/detalle-apiario';
import { ColmenaDetailComponent } from './colmenas/detail/detalle-colmena';
import { MapaInteractivo } from './mapa-interactivo/mapa-interactivo';
import { Inicio } from './inicio/inicio';
import { OperacionSalaComponent } from './operaciones_sala/operacion_sala.component';
import { HistorialInspeccionesComponent } from './inspecciones/historial/historial-inspecciones';
import { NuevaInspeccionComponent } from './inspecciones/nueva/nueva-inspeccion';
import { InspeccionarColmenaComponent } from './inspecciones/colmena/inspeccionar-colmena';
import { DetalleInspeccionComponent } from './inspecciones/detalle/detalle-inspeccion';
import { AudioRecorderComponent } from './audio-recorder/audio-recorder';
import { MaterialesComponent } from './materiales/materiales.component';
import { ReporteCierreTemporadaComponent } from './reportes/cierre-temporada/reporte-cierre-temporada';

import { authGuard } from './core/guards/auth.guard';
import { logoutGuard } from './core/guards/logout.guard';
import { guestGuard } from './core/guards/guest.guard';
import { LoginComponent } from './auth/login/login';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'recuperar-contrasena',
    loadComponent: () =>
      import('./auth/recuperar-contrasena/recuperar-contrasena').then(
        (m) => m.RecuperarContrasenaComponent,
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'admin/registro',
    loadComponent: () => import('./auth/registro/registro').then((m) => m.RegistroComponent),
    canActivate: [guestGuard],
  },

  {
    path: 'logout',
    canActivate: [logoutGuard],
    component: LoginComponent,
  },

  // Rutas protegidas (con guard)
  { path: 'apiarios', component: ApiarioListComponent, canActivate: [authGuard] },

  { path: 'apiarios/:id', component: ApiarioDetailComponent, canActivate: [authGuard] },
  {
    path: 'apiarios/:id/inspecciones',
    component: HistorialInspeccionesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'apiarios/:id/inspecciones/nueva',
    component: NuevaInspeccionComponent,
    canActivate: [authGuard],
  },
  {
    path: 'apiarios/:apiarioId/inspecciones/:inspeccionId',
    component: DetalleInspeccionComponent,
    canActivate: [authGuard],
  },
  {
    path: 'apiarios/:apiarioId/inspecciones/:inspeccionId/colmenas/:colmenaId',
    component: InspeccionarColmenaComponent,
    canActivate: [authGuard],
  },
  { path: 'colmenas/:id', component: ColmenaDetailComponent, canActivate: [authGuard] },

  { path: 'mapa', component: MapaInteractivo, canActivate: [authGuard] },

  { path: 'inicio', component: Inicio, canActivate: [authGuard] },

  { path: 'extraccion', component: OperacionSalaComponent, canActivate: [authGuard] },

  { path: 'reportes', component: ReporteCierreTemporadaComponent, canActivate: [authGuard] },

  { path: 'voz', component: AudioRecorderComponent, canActivate: [authGuard] },

  { path: 'materiales', component: MaterialesComponent, canActivate: [authGuard] },

  // ── Default ───────────────────────────────────────────────────────────────
  { path: '', redirectTo: 'mapa', pathMatch: 'full' },
];
