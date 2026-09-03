import { Component, EventEmitter, Output, AfterViewInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { ApiarioService } from '../apiarios/apiario.service';

@Component({
  selector: 'app-selector-ubicacion',
  imports: [],
  templateUrl: './selector-ubicacion.html',
  styleUrl: './selector-ubicacion.css',
})
export class SelectorUbicacionComponent implements AfterViewInit {
  
  private mapa: any;
  private userMarker: L.Marker | undefined;

  //Instanciamos el icono a nivel de clase para poder reutilizarlo en varios métodos
  private iconoNuevaUbicacion: L.DivIcon | undefined;
  
  //Traemos el servicio de apiario para recuperar los que estan en la BD
  private apiarioService = inject(ApiarioService);
  
  //Evento que envia las coordenadas tipo double hacia afuera
  @Output() coordenadaSeleccionada = new EventEmitter<{ lat: number; lng: number }>();

  ngAfterViewInit(): void {
    this.iniciarMapa();
    this.cargarApiariosEnMapa();
  }

  private iniciarMapa() {
    this.mapa = L.map('mapa-seleccion', {
      zoomControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
    }).setView([-32.4103, -63.2314], 14);

    //Capa Esri Light Gray optimizada igual que la que usamos en mapa-interactivo
    const capaEsriGray = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
        minZoom: 3,
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        keepBuffer: 6,            
        updateWhenIdle: false,    
        updateWhenZooming: false, 
      }
    );
    capaEsriGray.addTo(this.mapa);
    //Ajuste de renderizado inicial
    requestAnimationFrame(() => {
      this.mapa.invalidateSize();
    });
  
    //Icono personalizado para marcar la nueva ubicacion
    this.iconoNuevaUbicacion = L.divIcon({
          className: 'hive-marker-wrapper',
          html: `
            <div class="hive-marker">
              <div class="hive-icon-bg is-proposal">
                <span class="material-symbols-outlined icono-panal is-arrow" style="font-variation-settings: 'FILL' 1;">
                  arrow_downward
                </span>
              </div>
              <div class="hive-label is-proposal-label">Nueva Ubicación</div>
            </div>
          `,
          iconSize: [40, 40],     
          iconAnchor: [20, 30],   
        });

    // Evento de clic en el mapa
    this.mapa.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;

    if (this.userMarker) {
      this.userMarker.setLatLng([lat, lng]);
    } else {
      this.userMarker = L.marker([lat, lng], { icon: this.iconoNuevaUbicacion }).addTo(this.mapa);
    }

    this.coordenadaSeleccionada.emit({ lat, lng });
  });
  }
  // Métodos de control de mapa enlazados a botones HTML
  zoomIn() {
    if (this.mapa) this.mapa.zoomIn();
  }
  zoomOut() {
    if (this.mapa) this.mapa.zoomOut();
  }

  //Metodo para obtener la ubicacion del usuario mediante boton
  getUbicacionActual() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coordenadas: [number, number] = [lat, lng];

        // Movemos la vista del mapa hacia el usuario
        this.mapa.setView(coordenadas, 17);

        // Controlamos el marcador una sola vez de forma consistente
        if (this.userMarker) {
          this.userMarker.setLatLng(coordenadas);
        } else {
          // Si no existe, lo creamos obligatoriamente con el icono de la flecha azul
          this.userMarker = L.marker(coordenadas, { icon: this.iconoNuevaUbicacion }).addTo(this.mapa);
        }

        //Popup de la ubicacion actual
        this.userMarker.bindPopup("Ubicación Actual Seleccionada");

        // Pasamos las coordenadas al componente padre
        this.coordenadaSeleccionada.emit({ lat, lng });

      }, () => {
        alert("No se pudo obtener la ubicación actual. Revisa los permisos de tu navegador.");
      });
    } else {
      alert("Geolocalización no soportada por el navegador");
    }
  }

  //Metodo para cargar los apiarios de la base de datos
  private cargarApiariosEnMapa() {
      this.apiarioService.getAll().subscribe({
        next: (apiario) => {
          apiario.forEach((apiario) => {
            if (apiario.latitude && apiario.longitude) {
              // Creación del contenedor HTML para el popup
              const popupContenedor = document.createElement('div');
              popupContenedor.style.textAlign = 'center';
  
              // Título del Apiario
              const titulo = document.createElement('h4');
              titulo.style.margin = '0 0 8px 0';
              titulo.innerHTML = `<strong>Apiario:</strong> ${apiario.name}`;
              popupContenedor.appendChild(titulo);
                  
              // Marcador HTML dinámico usando el diseño de extrusión y la etiqueta
              const markerIcon = L.divIcon({
                className: 'hive-marker-wrapper', // Clase principal invisible
                html: `
                  <div class="hive-marker">
                    <div class="hive-icon-bg">
                      <span class="material-symbols-outlined icono-panal" style="font-variation-settings: 'FILL' 1;">hive</span>
                    </div>
                    <div class="hive-label">${apiario.name}</div>
                  </div>
                `,
                iconSize: [60, 60],
                iconAnchor: [30, 45], 
                popupAnchor: [0, -40],
              });
  
              L.marker([apiario.latitude, apiario.longitude], { icon: markerIcon })
                .addTo(this.mapa)
                .bindPopup(popupContenedor);
            }
          });
        },
        error: (err) => {
          console.error('Error al cargar los apiarios:', err);
        },
      });
    }

}
