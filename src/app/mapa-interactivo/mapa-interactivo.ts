import { AfterViewInit, Component} from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa-interactivo',
  imports: [],
  templateUrl: './mapa-interactivo.html',
  styleUrl: './mapa-interactivo.css',
})

export class MapaInteractivo implements AfterViewInit {

  private mapa:any;
  private userMarker: L.Marker<any> | undefined;


  private panalIcono = L.icon({
  iconUrl: 'assets/icono_panal.png',
  iconSize: [40, 40],           // Tamaño de la imagen en píxeles [ancho, alto]
  iconAnchor: [20, 40],         // Punto de la imagen que apuntará a la coordenada (la base central del panal)
  popupAnchor: [0, -40]         // Punto desde donde se abrirá el cartelito flotante (popup) respecto al anclaje
  });

  ngAfterViewInit(): void {
    this.iniciarMapa();
  }

  // Método para iniciar el mapa 
  private iniciarMapa() {

    //Render del mapa centrado en Villa María
    this.mapa = L.map('mapa').setView([-32.4103, -63.2314], 13); 

    //Capa segura con las políticas obligatorias
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      referrerPolicy: 'no-referrer-when-downgrade'
    });
    osmLayer.addTo(this.mapa);

    //Boton para centrar la ubicacion
    const BotonUbicacion = L.Control.extend({
      options: {
        position: 'topleft' // Puedes usar 'topleft', 'topright', 'bottomleft', 'bottomright'
      },
      onAdd: (map: any) => {
        // Creamos el contenedor del botón
        const boton = L.DomUtil.create('button', 'boton-ubicacion-circular');
        
        // Icono o texto corto dentro del botón (puedes usar un emoji de mira/brújula o FontAwesome)
        // boton.innerHTML = '<img src="assets/mira_ubicacion.png" alt="Mira de ubicación" class="icono-mira">';
        boton.innerHTML = '<img src="assets/mira_ubicacion-2.png" alt="Mira de ubicación" class="icono-mira">';
        boton.title = 'Mostrar mi ubicación';

        // Vinculo entre el boton y la funcion de ubicacion 
        L.DomEvent.on(boton, 'click', (e) => {
          L.DomEvent.stopPropagation(e); // Evita que el mapa reciba el clic
          this.getUbicacionActual();
        });
        return boton;
      }
    });

    // Agregamos el boton al mapa
    this.mapa.addControl(new BotonUbicacion());
  }


  // Metodo para obtener la ubicacion del usuario
  getUbicacionActual() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coordenadas: [number, number] = [position.coords.latitude, position.coords.longitude];

        //Si el marcador ya existe, movemos su posicion. Si no, lo creamos.
        if (this.userMarker) {
          this.userMarker.setLatLng(coordenadas).openPopup();
        } else {
          this.userMarker = L.marker(coordenadas, { icon: this.panalIcono })
            .addTo(this.mapa)
            .bindPopup("Estás aquí")
            .openPopup();
        }
        // Movemos la camara del mapa hacia la ubicacion del usuario automaticamente
        this.mapa.setView(coordenadas, 17);

      }, () => {
        alert("No se pudo obtener la ubicación actual. Revisa los permisos de tu navegador.");
      });
    } else {
      alert("Geolocalización no soportada por el navegador");
    }
  }


  

}
