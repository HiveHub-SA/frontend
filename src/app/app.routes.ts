import { Routes } from '@angular/router';
import { ApiarioListComponent} from './apiarios/list/list-apiarios';
import { ApiarioDetailComponent} from './apiarios/detail/detalle-apiario';
import { ColmenaDetailComponent} from './colmenas/detail/detalle-colmena';

export const routes: Routes = [
  {
    path: 'apiarios',
    component: ApiarioListComponent,
  },
  {path: 'apiarios/:id',
  component: ApiarioDetailComponent,
  },
  {
    path: 'colmenas/:id',
    component: ColmenaDetailComponent,
  }

];
