import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { LogoutComponent } from './auth/logout/logout.component';
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

export const routes: Routes = [
  // --- Rutas públicas ---
  { path: 'login', component: LoginComponent },
  { path: 'logouttest', component: LogoutComponent },

  // --- Rutas protegidas ---
  { path: '', redirectTo: 'mapa', pathMatch: 'full' },
  { path: 'apiarios', component: ApiarioListComponent, canActivate: [AuthGuard] },
  { path: 'apiarios/:id', component: ApiarioDetailComponent, canActivate: [AuthGuard] },
  { path: 'apiarios/:id/inspecciones', component: HistorialInspeccionesComponent, canActivate: [AuthGuard] },
  { path: 'apiarios/:id/inspecciones/nueva', component: NuevaInspeccionComponent, canActivate: [AuthGuard] },
  { path: 'apiarios/:apiarioId/inspecciones/:inspeccionId', component: DetalleInspeccionComponent, canActivate: [AuthGuard] },
  { path: 'apiarios/:apiarioId/inspecciones/:inspeccionId/colmenas/:colmenaId', component: InspeccionarColmenaComponent, canActivate: [AuthGuard] },
  { path: 'colmenas/:id', component: ColmenaDetailComponent, canActivate: [AuthGuard] },
  { path: 'mapa', component: MapaInteractivo, canActivate: [AuthGuard] },
  { path: 'inicio', component: Inicio, canActivate: [AuthGuard] },
  { path: 'extraccion', component: OperacionSalaComponent, canActivate: [AuthGuard] },
  { path: 'voz', component: AudioRecorderComponent, canActivate: [AuthGuard] },
  { path: 'materiales', component: MaterialesComponent, canActivate: [AuthGuard] },

  // --- Wildcard ---
  { path: '**', redirectTo: '' }
];
