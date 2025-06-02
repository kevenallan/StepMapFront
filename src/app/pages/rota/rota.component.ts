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

    private ORS_API_KEY =
        '5b3ce3597851110001cf6248b6230345a07942ff8963b64258d71297';

    origem = 'mangabeira shopping';
    destino = 'almeidão';

    origemCoord: L.LatLng | null = null;
    destinoCoord: L.LatLng | null = null;

    private markerOrigem?: L.Marker;
    private markerDestino?: L.Marker;

    private modoSelecionando: 'origem' | 'destino' | null = null;

    constructor(private mapaService: MapaService, private http: HttpClient) {}

    ngAfterViewInit(): void {
        this.map = this.mapaService.initMap();
        console.log('L.Routing', L.Routing);

        this.map.on('click', (e: L.LeafletMouseEvent) => {
            if (this.modoSelecionando === 'origem') {
                this.origemCoord = e.latlng;
                if (this.markerOrigem) this.map.removeLayer(this.markerOrigem);
                this.markerOrigem = L.marker(e.latlng).addTo(this.map);
                this.modoSelecionando = null;
            } else if (this.modoSelecionando === 'destino') {
                this.destinoCoord = e.latlng;
                if (this.markerDestino)
                    this.map.removeLayer(this.markerDestino);
                this.markerDestino = L.marker(e.latlng).addTo(this.map);
                this.modoSelecionando = null;
            }
        });
    }

    async buscarEndereco(tipo: 'origem' | 'destino') {
        const endereco = tipo === 'origem' ? this.origem : this.destino;
        if (!endereco) return;

        const coord = await this.getCoordinates(endereco);

        if (coord) {
            this.map.setView(coord, 16);
            this.modoSelecionando = tipo;
            alert(
                `Agora clique no mapa para escolher o ponto exato da ${tipo}.`
            );
        } else {
            alert(`Endereço de ${tipo} não encontrado.`);
        }
    }

    async getCoordinates(address: string): Promise<L.LatLng | null> {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address
        )}`;
        try {
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
    montarRota() {
        if (!this.origemCoord || !this.destinoCoord) {
            alert('Você precisa clicar no mapa após digitar os endereços.');
            return;
        }

        const body = {
            coordinates: [
                [this.origemCoord.lng, this.origemCoord.lat],
                [this.destinoCoord.lng, this.destinoCoord.lat],
            ],
        };

        const url =
            'http://localhost:8080/ors-api/v2/directions/driving-car/geojson';

        this.http.post<any>(url, body).subscribe({
            next: (data) => {
                if (this.rotaControl) {
                    this.map.removeControl(this.rotaControl);
                }
                this.rotaControl = L.geoJSON(data).addTo(this.map);
                const coords = data.features[0].geometry.coordinates;
                const latLngs = coords.map((c: number[]) =>
                    L.latLng(c[1], c[0])
                );
                const bounds = L.latLngBounds(latLngs);
                this.map.fitBounds(bounds);
            },
            error: (error) => {
                console.error('Erro ao obter rota do backend:', error);
                alert('Erro ao obter rota do backend.');
            },
        });
    }
}
