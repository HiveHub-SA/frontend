import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';

import { ApiarioDTO, ApiarioVista } from '../apiarios/apiario.model';
import { RutaService } from './ruta.service';
import { RutaRequestDTO } from './ruta.model';

@Injectable({
    providedIn: 'root'
})
export class RutaManagerService {

    private rutaService = inject(RutaService);
    private http = inject(HttpClient);

    rutaPolylineIda: L.GeoJSON | null = null;
    rutaPolylineVuelta: L.GeoJSON | null = null;
    rutaCalculada: ApiarioDTO[] = [];

    rutaActiva = signal(false);
    calculandoRuta = false;

    modoSeleccionRuta = false;

    apiarioInicio?: ApiarioVista;

    apiariosSeleccionados: ApiarioVista[] = [];

    infoRuta = signal<{
        distanciaTotalKm: number;
        totalApiarios: number;
    } | null>(null);

    iniciarSeleccion() {

        this.modoSeleccionRuta = true;
        this.apiarioInicio = undefined;
        this.apiariosSeleccionados = [];
    }

    seleccionarApiario(apiario: ApiarioVista) {

        if (!this.apiarioInicio) {

            this.apiarioInicio = apiario;

            return;
        }

        if (apiario.id === this.apiarioInicio.id)
            return;

        if (this.apiariosSeleccionados.some(a => a.id === apiario.id))
            return;

        this.apiariosSeleccionados.push(apiario);
    }

    manejarBotonRuta(
        mapa: L.Map,
        apiariosMarkers: L.Marker[]
    ) {

        if (this.rutaActiva()) {

            this.limpiarRuta(
                mapa,
                apiariosMarkers
            );

            return;
        }

        if (!this.modoSeleccionRuta) {

            this.iniciarSeleccion();

            return;
        }

        this.calcularRuta(
            mapa,
            apiariosMarkers
        );

    }

    calcularRuta(
        mapa: L.Map,
        apiariosMarkers: L.Marker[]
    ) {

        if (!this.apiarioInicio) {
            return;
        }

        if (this.apiariosSeleccionados.length === 0) {
            return;
        }

        this.calculandoRuta = true;

        const request: RutaRequestDTO = {
            apiarioInicioId: this.apiarioInicio.id,
            apiariosDestinoIds: this.apiariosSeleccionados.map(a => a.id)
        };

        this.rutaService
            .calcularRuta(request)
            .subscribe({

                next: (data) => {

                    const rutaIda = data.ruta.slice(0, -1);
                    const rutaVuelta = data.ruta.slice(-2);

                    const coordsIda = rutaIda
                        .map(a => `${a.longitude},${a.latitude}`)
                        .join(';');

                    const coordsVuelta = rutaVuelta
                        .map(a => `${a.longitude},${a.latitude}`)
                        .join(';');

                    const osrmIda =
                        `https://router.project-osrm.org/route/v1/driving/${coordsIda}?overview=full&geometries=geojson`;

                    const osrmVuelta =
                        `https://router.project-osrm.org/route/v1/driving/${coordsVuelta}?overview=full&geometries=geojson`;

                    forkJoin({

                        ida: this.http.get<any>(osrmIda),

                        vuelta: this.http.get<any>(osrmVuelta)

                    }).subscribe({

                        next: (res) => {
                            const distancia =
                                (
                                    res.ida.routes[0].distance +
                                    res.vuelta.routes[0].distance
                                ) / 1000;

                            this.infoRuta.set({

                                distanciaTotalKm: Number(distancia.toFixed(2)),

                                totalApiarios: data.totalApiarios

                            });
                            this.rutaCalculada = data.ruta;

                            this.dibujarRuta(
                                mapa,
                                apiariosMarkers,
                                data.ruta,
                                res.ida.routes[0].geometry,
                                res.vuelta.routes[0].geometry
                            );

                            this.rutaActiva.set(true);
                            this.calculandoRuta = false;

                            this.modoSeleccionRuta = false;

                            this.apiarioInicio = undefined;

                            this.apiariosSeleccionados = [];

                        },

                        error: () => {

                            alert("Error al conectar con OSRM.");

                            this.calculandoRuta = false;

                        }

                    });

                },

                error: (err) => {

                    alert(
                        typeof err.error === 'string'
                            ? err.error
                            : 'No se pudo calcular la ruta.'
                    );

                    this.calculandoRuta = false;

                }

            });
    }

    limpiarRuta(
        mapa: L.Map,
        apiariosMarkers: L.Marker[]
    ) {

        if (this.rutaPolylineIda) {
            mapa.removeLayer(this.rutaPolylineIda);
            this.rutaPolylineIda = null;
        }

        if (this.rutaPolylineVuelta) {
            mapa.removeLayer(this.rutaPolylineVuelta);
            this.rutaPolylineVuelta = null;
        }
        this.rutaActiva.set(false);
        this.modoSeleccionRuta = false;

        this.apiarioInicio = undefined;

        this.apiariosSeleccionados = [];

        this.infoRuta.set(null);
        this.rutaCalculada = [];
        apiariosMarkers.forEach(m => m.addTo(mapa));
    }

    private dibujarRuta(
        mapa: L.Map,
        apiariosMarkers: L.Marker[],
        apiarios: ApiarioDTO[],
        geometryIda: any,
        geometryVuelta: any
    ) {

        this.rutaPolylineIda = L.geoJSON(geometryIda, {
            style: {
                color: '#00c2e0',
                weight: 5,
                opacity: 0.95
            }
        }).addTo(mapa);

        this.rutaPolylineVuelta = L.geoJSON(geometryVuelta, {
            style: {
                color: '#0057d9',
                weight: 5,
                opacity: 0.95,
                dashArray: '10,10'
            }
        }).addTo(mapa);

    }

    esInicio(apiario: ApiarioVista): boolean {
        return this.apiarioInicio?.id === apiario.id;
    }

    estaSeleccionado(apiario: ApiarioVista): boolean {
        return this.apiariosSeleccionados.some(a => a.id === apiario.id);
    }

    obtenerTextoBotonRuta(): string {

        return this.apiarioInicio
            ? 'Agregar ruta'
            : 'Agregar inicio';

    }

    agregarDesdePopup(apiario: ApiarioVista): void {

        if (this.rutaActiva())
            return;

        if (!this.modoSeleccionRuta)
            this.iniciarSeleccion();

        this.seleccionarApiario(apiario);

    }

    esDestino(apiario: ApiarioVista): boolean {

        return this.apiariosSeleccionados.some(
            a => a.id === apiario.id
        );

    }

    quitarDesdePopup(apiario: ApiarioVista): void {

        if (this.esInicio(apiario)) {

            const confirmar = confirm(
                'Si quita el apiario inicial se eliminará toda la selección de la ruta. ¿Desea continuar?'
            );

            if (!confirmar) {
                return;
            }

            this.apiarioInicio = undefined;
            this.apiariosSeleccionados = [];
            return;
        }

        this.apiariosSeleccionados =
            this.apiariosSeleccionados.filter(
                a => a.id !== apiario.id
            );

    }

    obtenerOrden(apiario: ApiarioVista): number | null {

        const indice = this.rutaCalculada.findIndex(
            a => a.id === apiario.id
        );

        return indice >= 0 ? indice + 1 : null;

    }
    redibujarRuta(
        mapa: L.Map,
        apiariosMarkers: L.Marker[]
    ) {

        if (!this.rutaCalculada || this.rutaCalculada.length < 2) {
            return;
        }

        // Borrar polilineas anteriores
        if (this.rutaPolylineIda)
            mapa.removeLayer(this.rutaPolylineIda);

        if (this.rutaPolylineVuelta)
            mapa.removeLayer(this.rutaPolylineVuelta);

        // Reconstruir coordenadas
        const rutaIda = this.rutaCalculada.slice(0, -1);
        const rutaVuelta = this.rutaCalculada.slice(-2);

        const coordsIda = rutaIda
            .map(a => `${a.longitude},${a.latitude}`)
            .join(';');

        const coordsVuelta = rutaVuelta
            .map(a => `${a.longitude},${a.latitude}`)
            .join(';');

        const osrmIda =
            `https://router.project-osrm.org/route/v1/driving/${coordsIda}?overview=full&geometries=geojson`;

        const osrmVuelta =
            `https://router.project-osrm.org/route/v1/driving/${coordsVuelta}?overview=full&geometries=geojson`;

        forkJoin({
            ida: this.http.get<any>(osrmIda),
            vuelta: this.http.get<any>(osrmVuelta)
        }).subscribe({

            next: (res) => {

                this.rutaPolylineIda = L.geoJSON(res.ida.routes[0].geometry, {
                    style: {
                        color: '#00c2e0',
                        weight: 5,
                        opacity: 0.95
                    }
                }).addTo(mapa);

                this.rutaPolylineVuelta = L.geoJSON(res.vuelta.routes[0].geometry, {
                    style: {
                        color: '#0057d9',
                        weight: 5,
                        opacity: 0.95,
                        dashArray: '10,10'
                    }
                }).addTo(mapa);

                // Recargar marcadores con sus números
                apiariosMarkers.forEach(m => m.addTo(mapa));

            },
            error: () => {
                alert('No se pudo redibujar la ruta.');
            }
        });
    }

}