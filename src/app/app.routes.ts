import { Routes } from '@angular/router';
import { MapaInteractivo } from './mapa-interactivo/mapa-interactivo';
import { App } from './app';
import { Inicio } from './inicio/inicio';


export const routes: Routes = [
    {path: "mapa", component: MapaInteractivo},
    {path: "inicio", component: Inicio},
    {path: "", component: Inicio},
];
