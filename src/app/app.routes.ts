import { Routes } from '@angular/router';
import { ApiarioListComponent} from './apiarios/list/list-apiarios';
import { ApiarioDetailComponent} from './apiarios/detail/detalle-apiario';

export const routes: Routes = [
  {
    path: 'apiarios',
    component: ApiarioListComponent,
  },
  {path: 'apiarios/:id',
  component: ApiarioDetailComponent,
  },

];
