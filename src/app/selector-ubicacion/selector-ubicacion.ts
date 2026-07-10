import { Component, EventEmitter, Output, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-selector-ubicacion',
  imports: [],
  templateUrl: './selector-ubicacion.html',
  styleUrl: './selector-ubicacion.css',
})
export class SelectorUbicacionComponent implements AfterViewInit {
  private mapa: any;
  private userMarker: L.Marker | undefined;

  private panalIcono = L.icon({
  iconUrl: 'assets/icono_panal.png',
  iconSize: [40, 40],           // Tamaño de la imagen en pixeles [ancho, alto]
  iconAnchor: [20, 40],         // Punto de la imagen que apuntara a la coordenada (la base central del panal)
  popupAnchor: [0, -40]         // Punto desde donde se abrira el popup respecto al anclaje
  });

  //Evento que envia las coordenadas tipo double hacia afuera
  @Output() coordenadaSeleccionada = new EventEmitter<{ lat: number; lng: number }>();

  ngAfterViewInit(): void {
    this.iniciarMapa();
  }

  private iniciarMapa() {
    //Render del mapa centrado en Villa Maria
    this.mapa = L.map('mapa-seleccion').setView([-32.4103, -63.2314], 13); 

    //Capa segura con las politicas obligatorias
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      referrerPolicy: 'no-referrer-when-downgrade'
    });
    osmLayer.addTo(this.mapa);

    //Boton para centrar la ubicacion actual
    const BotonUbicacion = L.Control.extend({
      options: {
        position: 'topleft' 
      },
      onAdd: (map: any) => {
        const boton = L.DomUtil.create('button', 'boton-ubicacion-circular');
        boton.innerHTML = '<img src="assets/mira_ubicacion-2.png" alt="Mira de ubicación" class="icono-mira">';
        boton.title = 'Mostrar mi ubicación';

        L.DomEvent.on(boton, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          this.getUbicacionActual();
        });
        return boton;
      }
    });

    this.mapa.addControl(new BotonUbicacion());

    // Evento de clic en el mapa para posicionar el marcador del apiario y emitir datos
    this.mapa.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (this.userMarker) {
        this.userMarker.setLatLng([lat, lng]);
      } else {
        this.userMarker = L.marker([lat, lng], { icon: this.panalIcono }).addTo(this.mapa);
      }

      //Pasamos las coordenadas tipo double al componente padre
      this.coordenadaSeleccionada.emit({ lat, lng });
    });
  }

  //Metodo para obtener la ubicacion del usuario mediante boton
  getUbicacionActual() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coordenadas: [number, number] = [position.coords.latitude, position.coords.longitude];

        //Logica para mostrar un popup con el mensaje estas aqui (esto despues lo vamos a cambiar por los datos del apiario)
        if (this.userMarker) {
          this.userMarker.setLatLng(coordenadas).openPopup();
        } else {
          this.userMarker = L.marker(coordenadas, { icon: this.panalIcono })
            .addTo(this.mapa)
            .bindPopup("Estás aquí")
            .openPopup();
        }
        
        //Movemos el mapa para la ubicacion actual
        this.mapa.setView(coordenadas, 17);

        //Logica para tomar las coordenadas de la ubicacion actual
        if (this.userMarker) {
          this.userMarker.setLatLng(coordenadas);
        } else {
          //si no existe el marcador todavia lo creamos en las coordenadas actuales
          this.userMarker = L.marker(coordenadas, { icon: this.panalIcono }).addTo(this.mapa);
        }

        //Pasamos las coordenadas tipo double al componente padre
        this.coordenadaSeleccionada.emit({ 
          lat: position.coords.latitude, 
          lng: position.coords.longitude 
        });

      }, () => {
        alert("No se pudo obtener la ubicación actual. Revisa los permisos de tu navegador.");
      });
    } else {
      alert("Geolocalización no soportada por el navegador");
    }
  }


}