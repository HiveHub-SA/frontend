import { Routes } from '@angular/router';
import { OperacionSalaComponent } from './operaciones_sala/operacion_sala.component';

export const routes: Routes = [
  { path: 'extraccion', component: OperacionSalaComponent },
  { path: '', redirectTo: 'extraccion', pathMatch: 'full' }
];
