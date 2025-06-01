import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
    providedIn: 'root',
})
export class MapaService {
    constructor() {}

    initMap(): L.Map {
        const center: L.LatLngExpression = [-7.1654, -34.8631]; // Mangabeira, João Pessoa
        const zoom = 14;

        const map = L.map('mapa').setView(center, zoom);

        // Corrigir ícones padrão do Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: '/assets/leaflet/marker-icon-2x.png',
            iconUrl: '/assets/leaflet/marker-icon.png',
            shadowUrl: '/assets/leaflet/marker-shadow.png',
        });

        // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //     attribution: '© OpenStreetMap contributors',
        // }).addTo(map);

        // Estilo claro e limpo (CartoDB Positron)
        // L.tileLayer(
        //     'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        //     {
        //         attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
        //     }
        // ).addTo(map);

        //Stadia Outdoors
        L.tileLayer(
            'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png',
            {
                maxZoom: 20,
                attribution:
                    '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, ' +
                    '&copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, ' +
                    '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
            }
        ).addTo(map);

        return map;
    }
}
