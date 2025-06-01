import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { MapaService } from '../../core/service/mapa.service';

@Component({
    selector: 'app-mapa',
    imports: [],
    templateUrl: './mapa.component.html',
    styleUrl: './mapa.component.scss',
})
export class MapaComponent implements AfterViewInit {
    private map!: L.Map;
    private userMarker!: L.Marker;

    constructor(private mapaService: MapaService) {}

    ngAfterViewInit(): void {
        this.map = this.mapaService.initMap();

        this.watchUserLocation();
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

                    // Adiciona um marker no novo ponto
                    L.marker([lat, lng])
                        .addTo(this.map)
                        .bindPopup(
                            `Movimento: ${new Date().toLocaleTimeString()}`
                        )
                        .openPopup();
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
