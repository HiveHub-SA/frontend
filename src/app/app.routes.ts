import { Routes } from '@angular/router';
import { ApiarioListComponent} from './apiarios/list/list-apiarios';
import { ApiarioDetailComponent} from './apiarios/detail/detalle-apiario';
import { ColmenaDetailComponent} from './colmenas/detail/detalle-colmena';
import { MapaInteractivo } from './mapa-interactivo/mapa-interactivo';
import { App } from './app';
import { Inicio } from './inicio/inicio';
import { OperacionSalaComponent } from './operaciones_sala/operacion_sala.component';
import { AudioRecorderComponent } from './audio-recorder/audio-recorder';


export const routes: Routes = [
  { path: '', component: MapaInteractivo },
  { path: 'apiarios', component: ApiarioListComponent },
  { path: 'apiarios/:id', component: ApiarioDetailComponent },
  { path: 'colmenas/:id', component: ColmenaDetailComponent },
  { path: 'mapa', component: MapaInteractivo },
  { path: 'inicio', component: Inicio },
  { path: 'extraccion', component: OperacionSalaComponent },
  { path: 'voz', component: AudioRecorderComponent },
];

