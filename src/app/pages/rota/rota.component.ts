import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import * as L from 'leaflet';
import 'leaflet-routing-machine';

import { MapaService } from '../../core/service/mapa.service';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-rota',
    templateUrl: './rota.component.html',
    styleUrls: ['./rota.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        InputTextModule,
        FloatLabel,
        ButtonModule,
        HttpClientModule,
    ],
})
export class RotaComponent implements AfterViewInit {
    private map!: L.Map;
    private rotaControl: any;

    origem = '';
    destino = '';

    constructor(private mapaService: MapaService, private http: HttpClient) {}

    ngAfterViewInit(): void {
        this.map = this.mapaService.initMap();
    }

    async getCoordinates(address: string): Promise<L.LatLng | null> {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address
        )}`;
        try {
            // Usando HttpClient ao invés de fetch
            const data: any = await firstValueFrom(this.http.get<any[]>(url));

            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                return L.latLng(lat, lon);
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar coordenadas:', error);
            return null;
        }
    }

    async montarRota() {
        if (this.rotaControl) {
            this.map.removeControl(this.rotaControl);
        }

        const pontoA = await this.getCoordinates(this.origem);
        const pontoB = await this.getCoordinates(this.destino);

        if (!pontoA || !pontoB) {
            alert('Não foi possível encontrar as coordenadas dos endereços.');
            return;
        }

        this.rotaControl = L.Routing.control({
            waypoints: [pontoA, pontoB],
            routeWhileDragging: false,
            createMarker: (_index: number, waypoint: L.LatLng | null) => {
                if (!waypoint) return null;
                return L.marker(waypoint, { draggable: false });
            },
        }).addTo(this.map);

        this.rotaControl.on('routesfound', (e: any) => {
            const route = e.routes[0];
            const bounds = L.latLngBounds(route.coordinates);
            this.map.fitBounds(bounds);
        });
    }
}
