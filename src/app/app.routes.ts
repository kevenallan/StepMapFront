import { Routes } from '@angular/router';
import { MapaComponent } from './pages/mapa/mapa.component';
import { RotaComponent } from './pages/rota/rota.component';
import { MenuComponent } from './layout/menu/menu.component';
import { NavegacaoComponent } from './pages/navegacao/navegacao.component';

export const routes: Routes = [
    {
        path: 'app',
        component: MenuComponent,
        children: [
            { path: 'mapa', component: MapaComponent },
            { path: 'rota', component: RotaComponent },
            { path: 'navegacao', component: NavegacaoComponent },
            { path: '', redirectTo: 'mapa', pathMatch: 'full' },
        ],
    },
    { path: '', redirectTo: 'app', pathMatch: 'full' },
    { path: '**', redirectTo: 'app' },
];
