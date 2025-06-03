import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import * as L from 'leaflet';
import 'leaflet-routing-machine';

import { MapaService } from '../../core/service/mapa.service';
import { environment } from '../../../environments/environment';

import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
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
        AutoCompleteModule,
        FloatLabel,
        ButtonModule,
        HttpClientModule,
    ],
})
export class RotaComponent implements AfterViewInit {
    private map!: L.Map;
    private rotaControl: any;

    origem: any;
    destino: any;

    origemSuggestions: any[] = [];
    destinoSuggestions: any[] = [];

    origemCoord: L.LatLng | null = null;
    destinoCoord: L.LatLng | null = null;
    tipoSelecionadoParaMarcador: 'origem' | 'destino' | null = null;

    private markerOrigem?: L.Marker;
    private markerDestino?: L.Marker;

    rastreamentoAtivo = false;
    watchId: number | null = null;

    constructor(private mapaService: MapaService, private http: HttpClient) {}

    ngAfterViewInit(): void {
        this.map = this.mapaService.initMap();
        this.map.stopLocate();

        // this.iniciarRastreamento(); // novo método abaixo

        this.map.on('click', (e: L.LeafletMouseEvent) => {
            if (!this.tipoSelecionadoParaMarcador) return;

            const coord = e.latlng;
            const marker = L.marker(coord).addTo(this.map);

            if (this.tipoSelecionadoParaMarcador === 'origem') {
                if (this.markerOrigem) this.map.removeLayer(this.markerOrigem);
                this.markerOrigem = marker;
                this.origemCoord = coord;
            } else if (this.tipoSelecionadoParaMarcador === 'destino') {
                if (this.markerDestino)
                    this.map.removeLayer(this.markerDestino);
                this.markerDestino = marker;
                this.destinoCoord = coord;
            }

            this.tipoSelecionadoParaMarcador = null;
        });
    }

    buscarSugestoes(event: any, tipo: 'origem' | 'destino') {
        const query = event.query;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
        )}&countrycodes=br&addressdetails=1&limit=5`;

        this.http.get<any[]>(url).subscribe((data) => {
            if (tipo === 'origem') {
                this.origemSuggestions = data;
            } else {
                this.destinoSuggestions = data;
            }
        });
    }

    selecionarEndereco(tipo: 'origem' | 'destino') {
        const endereco = tipo === 'origem' ? this.origem : this.destino;
        if (!endereco) return;

        const coord = L.latLng(+endereco.lat, +endereco.lon);

        this.map.setView(coord, 16);

        // Não adiciona marcador aqui, apenas guarda o tipo de marcador que será adicionado no clique
        this.tipoSelecionadoParaMarcador = tipo;
    }

    routeLayer!: L.GeoJSON;
    userMarker: L.Marker | null = null;

    montarRota() {
        if (!this.origemCoord || !this.destinoCoord) {
            alert('Você precisa selecionar a origem e o destino.');
            return;
        }
        this.iniciarRastreamento();
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
                    if (this.routeLayer) {
                        this.map.removeLayer(this.routeLayer);
                    }

                    this.routeLayer = L.geoJSON(res).addTo(this.map);
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

    private iniciarRastreamento(): void {
        if (!navigator.geolocation) {
            alert('Geolocalização não suportada.');
            return;
        }

        this.watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                if (!this.userMarker) {
                    this.userMarker = L.marker([lat, lng])
                        .addTo(this.map)
                        .bindPopup(
                            `Movimento: ${new Date().toLocaleTimeString()}`
                        )
                        .openPopup();
                } else {
                    this.userMarker
                        .setLatLng([lat, lng])
                        .getPopup()
                        ?.setContent(
                            `Movimento: ${new Date().toLocaleTimeString()}`
                        );
                }

                // Só centraliza se o modo de rastreamento estiver ativado
                if (this.rastreamentoAtivo) {
                    this.map.setView([lat, lng]);
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
    }

    private watchUserLocation(): void {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;

                    if (!this.userMarker) {
                        this.userMarker = L.marker([lat, lng])
                            .addTo(this.map)
                            .bindPopup(
                                `Movimento: ${new Date().toLocaleTimeString()}`
                            )
                            .openPopup();
                    } else {
                        this.userMarker
                            .setLatLng([lat, lng])
                            .getPopup()
                            ?.setContent(
                                `Movimento: ${new Date().toLocaleTimeString()}`
                            );
                    }

                    // 🔁 Só centraliza se o rastreamento estiver ativo
                    if (this.rastreamentoAtivo) {
                        this.map.setView([lat, lng], 16);
                        // opcional: abrir popup
                        this.userMarker.openPopup();
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

    toggleRastreamento() {
        this.rastreamentoAtivo = !this.rastreamentoAtivo;

        if (this.rastreamentoAtivo && this.userMarker) {
            const latlng = this.userMarker.getLatLng();
            this.map.setView(latlng, 16); // Centraliza imediatamente
        }
    }
}
