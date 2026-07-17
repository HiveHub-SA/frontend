import { Routes } from '@angular/router';
import { OperacionSalaComponent } from './operaciones_sala/operacion_sala.component';
import { MapaComponent } from './mapa/mapa.component';
import { ApiariosComponent } from './apiarios/apiarios.component';

export const routes: Routes = [
  { path: 'mapa', component: MapaComponent },
  { path: 'apiarios', component: ApiariosComponent },
  { path: 'extraccion', component: OperacionSalaComponent },
  { path: '', redirectTo: 'extraccion', pathMatch: 'full' }
];
