import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import * as L from 'leaflet';
import 'leaflet-routing-machine';

import { MapaService } from '../../core/service/mapa.service';
import { environment } from '../../../environments/environment';

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
    routeLayer!: L.GeoJSON;
    userMarker: L.Marker | null = null;

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
        this.http
            .post<any>(
                `${environment.apiUrl}/v2/directions/driving-car/geojson`,
                body
            )
            .subscribe({
                next: (res) => {
                    console.log('Resposta da rota:', res);

                    // Se já existe uma rota, remova antes de adicionar a nova
                    if (this.routeLayer) {
                        this.map.removeLayer(this.routeLayer);
                    }

                    // Cria uma camada GeoJSON com a rota
                    this.routeLayer = L.geoJSON(res).addTo(this.map);

                    // Ajusta o zoom do mapa para caber toda a rota
                    this.map.fitBounds(this.routeLayer.getBounds());
                    this.watchUserLocation();
                },
                error: (err) => {
                    console.error('Erro ao obter rota do backend:', err);
                    alert(
                        'Não foi possível obter a rota. Tente novamente mais tarde.'
                    );
                },
            });
    }
    private watchUserLocation(): void {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;

                    console.log('Movimento detectado:', lat, lng);

                    // Atualiza o mapa para o novo local (opcional)
                    this.map.setView([lat, lng], 16);

                    if (!this.userMarker) {
                        // Cria o marker apenas uma vez
                        this.userMarker = L.marker([lat, lng])
                            .addTo(this.map)
                            .bindPopup(
                                `Movimento: ${new Date().toLocaleTimeString()}`
                            )
                            .openPopup();
                    } else {
                        // Atualiza a posição do marker existente
                        this.userMarker
                            .setLatLng([lat, lng])
                            .getPopup()
                            ?.setContent(
                                `Movimento: ${new Date().toLocaleTimeString()}`
                            )
                            .openOn(this.map);
                    }
                },
                (err) => {
                    console.error('Erro ao rastrear localização:', err);
                    alert('Erro ao rastrear localização: ' + err.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } else {
            alert('Geolocalização não suportada pelo navegador.');
        }
    }
}
