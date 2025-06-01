import { Routes } from '@angular/router';
import { MapaComponent } from './pages/mapa/mapa.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
    },
    {
        path: 'mapa',
        component: MapaComponent
    }
];
