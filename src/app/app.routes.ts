import { Routes } from '@angular/router';
import { MapaComponent } from './pages/mapa/mapa.component';
import { RotaComponent } from './pages/rota/rota.component';
import { NavegacaoComponent } from './pages/navegacao/navegacao.component';

export const routes: Routes = [
    {
        path: 'app',
        component: NavegacaoComponent,
        children: [
            { path: 'mapa', component: MapaComponent },
            { path: 'rota', component: RotaComponent },
            { path: '', redirectTo: 'mapa', pathMatch: 'full' },
        ],
    },
    { path: '', redirectTo: 'app', pathMatch: 'full' },
    { path: '**', redirectTo: 'app' },
];
