import { Component } from '@angular/core';
import { MapaComponent } from "./pages/mapa/mapa.component";

@Component({
  selector: 'app-root',
  imports: [MapaComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'stepmap';
}
