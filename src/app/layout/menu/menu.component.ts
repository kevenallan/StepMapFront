import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    standalone: true,
    imports: [RouterModule, MenubarModule],
})
export class MenuComponent implements OnInit {
    items: MenuItem[] | undefined;
    constructor(private router: Router, private route: ActivatedRoute) {}

    ngOnInit() {
        this.items = [
            {
                label: 'Mapa',
                icon: 'pi pi-globe',
                routerLink: '/app/mapa',
            },
            {
                label: 'Rota',
                icon: 'pi pi-map',
                routerLink: '/app/rota',
            },
            {
                label: 'Navegação',
                icon: 'pi pi-map',
                routerLink: '/app/navegacao',
            },
        ];
    }
}
