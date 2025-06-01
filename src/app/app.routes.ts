import { Routes } from '@angular/router';
import { MapaComponent } from './pages/mapa/mapa.component';
import { HomeComponent } from './pages/home/home.component';
import { RotaComponent } from './pages/rota/rota.component';

export const routes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
    },
    {
        path: 'mapa',
        component: MapaComponent,
    },
    {
        path: 'rota',
        component: RotaComponent,
    },
    {
        path: '**',
        component: HomeComponent,
    },
];
