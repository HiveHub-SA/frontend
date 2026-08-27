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

export const routes: Routes = [
  { path: '', redirectTo: 'mapa', pathMatch: 'full' },
  { path: 'apiarios', component: ApiarioListComponent },
  { path: 'apiarios/:id', component: ApiarioDetailComponent },
  { path: 'apiarios/:id/inspecciones', component: HistorialInspeccionesComponent },
  { path: 'apiarios/:id/inspecciones/nueva', component: NuevaInspeccionComponent },
  { path: 'apiarios/:apiarioId/inspecciones/:inspeccionId', component: DetalleInspeccionComponent },
  { path: 'apiarios/:apiarioId/inspecciones/:inspeccionId/colmenas/:colmenaId', component: InspeccionarColmenaComponent },
  { path: 'colmenas/:id', component: ColmenaDetailComponent },
  { path: 'mapa', component: MapaInteractivo },
  { path: 'inicio', component: Inicio },
  { path: 'extraccion', component: OperacionSalaComponent },
  { path: 'voz', component: AudioRecorderComponent },
  { path: 'materiales', component: MaterialesComponent },
];


