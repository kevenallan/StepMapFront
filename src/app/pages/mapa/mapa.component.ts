import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
    selector: 'app-mapa',
    imports: [],
    templateUrl: './mapa.component.html',
    styleUrl: './mapa.component.scss',
})
export class MapaComponent implements AfterViewInit {
    private map!: L.Map;
    private userMarker!: L.Marker;

    ngAfterViewInit(): void {
        this.initMap();

        // Corrigir caminho dos ícones
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            // iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
            // iconUrl: 'assets/leaflet/marker-icon.png',
            // shadowUrl: 'assets/leaflet/marker-shadow.png',

            //C:\Dev\Projetos\StepMap\StepMapFront\src\app\pages\mapa\mapa.component.ts
            //C:\Dev\Projetos\StepMap\StepMapFront\src\assets\leaflet\marker-icon-2x.png
            iconRetinaUrl: '/assets/leaflet/marker-icon-2x.png',
            iconUrl: '/assets/leaflet/marker-icon.png',
            shadowUrl: '/assets/leaflet/marker-shadow.png',
        });

        // this.localizarUsuario();
        this.watchUserLocation();
    }

    private initMap(): void {
        this.map = L.map('mapa').setView([0, 0], 2); // Posição inicial genérica

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
        }).addTo(this.map);
    }

    // private localizarUsuario(): void {
    //     if (navigator.geolocation) {
    //         navigator.geolocation.getCurrentPosition(
    //             (pos) => {
    //                 const lat = pos.coords.latitude;
    //                 const lng = pos.coords.longitude;

    //                 console.log('Latitude:', lat, 'Longitude:', lng);

    //                 this.map.setView([lat, lng], 16);

    //                 this.userMarker = L.marker([lat, lng])
    //                     .addTo(this.map)
    //                     .bindPopup('Você está aqui.')
    //                     .openPopup();
    //             },
    //             (err) => {
    //                 console.error(
    //                     'Erro ao obter localização:',
    //                     err.code,
    //                     err.message
    //                 );
    //                 alert('Erro ao obter localização: ' + err.message);
    //             },
    //             {
    //                 enableHighAccuracy: true,
    //                 timeout: 10000,
    //                 maximumAge: 0,
    //             }
    //         );
    //     } else {
    //         alert('Geolocalização não é suportada pelo navegador.');
    //     }
    // }

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
