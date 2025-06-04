import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

import * as L from 'leaflet';
import 'leaflet-routing-machine';

import { MapaService } from '../../core/service/mapa.service';
import { environment } from '../../../environments/environment';

import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';

import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-navegacao',
    templateUrl: './navegacao.component.html',
    styleUrls: ['./navegacao.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        InputTextModule,
        AutoCompleteModule,
        ButtonModule,
        ProgressSpinnerModule,
    ],
})
export class NavegacaoComponent implements AfterViewInit, OnDestroy {
    private map!: L.Map;
    private routeLayer!: L.GeoJSON;

    origemCoord!: L.LatLng | null;

    destinos: any[] = [];
    destinosSuggestions: any[][] = [];
    destinosCoord: (L.LatLng | null)[] = [];
    destinosMarkers: (L.Marker | null)[] = [];

    aguardandoCliqueIndex: number | null = null;

    rastreamentoAtivo = false;
    watchId: number | null = null;
    userMarker: L.Marker | null = null;

    carregandoRota = false;

    constructor(private mapaService: MapaService, private http: HttpClient) {}

    ngAfterViewInit(): void {
        (window as any).ngComponent = this;
        this.map = this.mapaService.initMap();

        // Iniciar rastreamento para pegar origem (localização atual)
        this.iniciarRastreamento();

        // Ouvir clique no mapa para posicionar marcador do destino
        this.map.on('click', (e: L.LeafletMouseEvent) => {
            if (this.aguardandoCliqueIndex === null) return;

            const index = this.aguardandoCliqueIndex;
            const coord = e.latlng;

            // Se já existir marcador para esse destino, remove
            if (this.destinosMarkers[index]) {
                this.map.removeLayer(this.destinosMarkers[index]!);
            }

            // Criar marcador e adicionar ao mapa
            const marker = L.marker(coord, {
                draggable: false,
            }).addTo(this.map);

            this.destinosMarkers[index] = marker;
            this.destinosCoord[index] = coord;

            this.aguardandoCliqueIndex = null; // Sai do modo "aguardando clique"

            // Opcional: abrir popup com endereço ou nome do destino
            if (this.destinos[index]) {
                marker
                    .bindPopup(this.destinos[index].display_name || 'Destino')
                    .openPopup();
            }
        });
    }

    ngOnDestroy() {
        this.pararRastreamento();
    }

    buscarSugestoes(event: any, tipo: 'destino', index: number) {
        const query = event.query;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
        )}&countrycodes=br&addressdetails=1&limit=5`;

        this.http.get<any[]>(url).subscribe((data) => {
            this.destinosSuggestions[index] = data;
        });
    }

    iniciarPosicionamentoMarcador(i: number) {
        if (!this.destinos[i]) return;

        // Centralizar o mapa na localização selecionada
        const lat = +this.destinos[i].lat;
        const lon = +this.destinos[i].lon;
        this.map.setView([lat, lon], 16);

        // Indicar que está aguardando o clique para posicionar marcador
        this.aguardandoCliqueIndex = i;
    }

    montarRota() {
        if (!this.userMarker) {
            alert('Posição do usuário não definida ainda.');
            return;
        }

        // Origem é sempre a posição atual do usuário
        this.origemCoord = this.userMarker.getLatLng();

        if (!this.origemCoord) {
            alert('Origem não definida. Aguardando sua localização atual...');
            return;
        }

        // Validar se todos os destinos possuem coordenadas definidas
        for (let i = 0; i < this.destinosCoord.length; i++) {
            if (!this.destinosCoord[i]) {
                alert(`Posicione o marcador para o destino ${i + 1} no mapa.`);
                return;
            }
        }

        this.carregandoRota = true;

        // Montar array de coordenadas da rota: origem + destinos
        const coords = [this.origemCoord, ...this.destinosCoord].map((c) => [
            c!.lng,
            c!.lat,
        ]);

        const body = {
            coordinates: coords,
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
                },
                error: (err) => {
                    console.error('Erro ao obter rota:', err);
                    alert(
                        'Não foi possível obter a rota. Tente novamente mais tarde.'
                    );
                },
                complete: () => {
                    this.carregandoRota = false;
                },
            });
    }

    adicionarDestino() {
        this.destinos.push(null);
        this.destinosSuggestions.push([]);
        this.destinosCoord.push(null);
        this.destinosMarkers.push(null);
    }

    removerDestino(index: number) {
        // Remover marcador do mapa
        if (this.destinosMarkers[index]) {
            this.map.removeLayer(this.destinosMarkers[index]!);
        }

        // Remover dados dos arrays
        this.destinos.splice(index, 1);
        this.destinosSuggestions.splice(index, 1);
        this.destinosCoord.splice(index, 1);
        this.destinosMarkers.splice(index, 1);

        // Se estiver no modo aguardando clique para esse índice, cancelar
        if (this.aguardandoCliqueIndex === index) {
            this.aguardandoCliqueIndex = null;
        }

        // Recalcular rota se houver pelo menos um destino
        if (this.destinosCoord.length > 0 && this.origemCoord) {
            this.montarRota();
        } else {
            // Se não houver destinos, remove rota do mapa
            if (this.routeLayer) {
                this.map.removeLayer(this.routeLayer);
            }
        }
    }

    iniciarRastreamento() {
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
                        .bindPopup(`Você está aqui`)
                        .openPopup();

                    this.origemCoord = L.latLng(lat, lng);
                    this.map.setView(this.origemCoord, 16);
                } else {
                    this.userMarker
                        .setLatLng([lat, lng])
                        .getPopup()
                        ?.setContent(
                            `Você está aqui (atualizado: ${new Date().toLocaleTimeString()})`
                        );
                }

                if (this.rastreamentoAtivo) {
                    this.map.setView([lat, lng], 16);
                }

                // Atualiza origemCoord para a posição atual do usuário
                this.origemCoord = this.userMarker.getLatLng();

                // Verificar proximidade dos destinos
                this.verificarProximidadeDestinos();
            },
            (err) => {
                console.error('Erro ao rastrear localização:', err);
                let erroDescricao = '';
                switch (err.code) {
                    case 1:
                        erroDescricao = 'Permissão negada';
                        break;
                    case 2:
                        erroDescricao = 'Posição indisponível';
                        break;
                    case 3:
                        erroDescricao = 'Tempo de espera esgotado';
                        break;
                    default:
                        erroDescricao = 'Erro desconhecido';
                }
                alert('Erro ao rastrear localização: ' + erroDescricao);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }

    pararRastreamento() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    toggleRastreamento() {
        this.rastreamentoAtivo = !this.rastreamentoAtivo;

        if (this.rastreamentoAtivo && this.userMarker) {
            const latlng = this.userMarker.getLatLng();
            this.map.setView(latlng, 16);
        }
    }

    verificarProximidadeDestinos() {
        if (!this.origemCoord) return;

        const LIMIAR = 30; // metros

        for (let i = 0; i < this.destinosCoord.length; i++) {
            if (!this.destinosCoord[i]) continue;

            const dist = this.origemCoord.distanceTo(this.destinosCoord[i]!);

            if (dist <= LIMIAR) {
                alert(
                    `Você chegou ao destino ${
                        this.destinos[i]?.display_name || i + 1
                    }`
                );

                // Remove marcador do mapa
                if (this.destinosMarkers[i]) {
                    this.map.removeLayer(this.destinosMarkers[i]!);
                }

                // Remove destino dos arrays
                this.destinos.splice(i, 1);
                this.destinosSuggestions.splice(i, 1);
                this.destinosCoord.splice(i, 1);
                this.destinosMarkers.splice(i, 1);

                // Recalcula rota se ainda houver destinos
                if (this.destinosCoord.length > 0) {
                    this.montarRota();
                } else {
                    // Remove rota do mapa se não tiver mais destinos
                    if (this.routeLayer) {
                        this.map.removeLayer(this.routeLayer);
                    }
                }

                break; // sai do loop para evitar conflito de índices
            }
        }
    }

    // Método para simular posição manualmente (opcional)
    simularPosicao(lat: number, lng: number) {
        const posAtual = L.latLng(lat, lng);

        if (!this.userMarker) {
            this.userMarker = L.marker(posAtual)
                .addTo(this.map)
                .bindPopup('Posição simulada')
                .openPopup();
            this.origemCoord = posAtual;
        } else {
            this.userMarker
                .setLatLng(posAtual)
                .getPopup()
                ?.setContent(
                    `Posição simulada: ${new Date().toLocaleTimeString()}`
                );
        }

        // Atualiza origemCoord
        this.origemCoord = posAtual;

        // Verifica se chegou a algum destino
        this.verificarProximidadeDestinos();
    }
}
