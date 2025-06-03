import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-navegacao',
    templateUrl: './navegacao.component.html',
    styleUrls: ['./navegacao.component.scss'],
    standalone: true,
    imports: [RouterModule],
})
export class NavegacaoComponent implements OnInit {
    constructor(private router: Router, private route: ActivatedRoute) {}

    ngOnInit() {}
    irParaMapa() {
        this.router.navigate(['mapa'], { relativeTo: this.route });
    }

    irParaRota() {
        this.router.navigate(['rota'], { relativeTo: this.route });
    }
}
