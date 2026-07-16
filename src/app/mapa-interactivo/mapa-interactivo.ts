import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { Router } from '@angular/router';
import { ApiarioMapasService, ApiarioDTO } from './apiario-mapas.service'; // Cambiar ruta en un futuro si es que usamos un solo servicio

@Component({
  selector: 'app-mapa-interactivo',
  imports: [], 
  templateUrl: './mapa-interactivo.html',
  styleUrl: './mapa-interactivo.css',
})
export class MapaInteractivo implements AfterViewInit, OnInit {
  private mapa: any;
  private userMarker: L.Marker<any> | undefined;

  // Inyectamos el servicio del apiario usando inject   
  private apiarioService = inject(ApiarioMapasService);
  private router = inject(Router);

  // Icono por defecto para la ubicacion del usuario
  // Icono de panal para las colmenas
  private usuarioIcono = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.iniciarMapa();
    this.cargarApiariosEnMapa(); // Llamamos a la carga de datos al iniciar el mapa
  }

  // Método para iniciar el mapa 
  private iniciarMapa() {
    // Render del mapa centrado en Villa Maria
    this.mapa = L.map('mapa', {
      zoomControl: false 
    }).setView([-32.4103, -63.2314], 14);

    // Capa segura con las políticas obligatorias

    //Mapa inactivo por el momento, es mas pesado para la carga web
    // const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //   maxZoom: 19,
    //   attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    //   referrerPolicy: 'no-referrer-when-downgrade'
    // });
    // osmLayer.addTo(this.mapa);

    //Otro mapa de prueba que parece mas liviano, luego vere cual dejo
    const capaCarto = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });
    
    capaCarto.addTo(this.mapa);


    setTimeout(() => {
      this.mapa.invalidateSize();
    }, 100); //Son 100ms de delay para que llegue a cargar todo el css

  }

  // Métodos de control de mapa enlazados a nuestros nuevos botones HTML
  zoomIn() {
    if (this.mapa) this.mapa.zoomIn();
  }
  zoomOut() {
    if (this.mapa) this.mapa.zoomOut();
  }

  // Método de acción para el botón principal
  onAnadirApiario() {
    // Aca va a ir la logica para navegar al componente de crear apiario
    console.log("Añadir Apiario clickeado");
    // this.router.navigate(['/apiarios/crear']);
  }

  // Método que trae los apiarios del backend y los dibuja
  private cargarApiariosEnMapa() {
    this.apiarioService.obtenerApiarios().subscribe({
      next: (apiarios: ApiarioDTO[]) => {
        apiarios.forEach(apiario => {
          if (apiario.latitude && apiario.longitude) {
            
            // Creación del contenedor HTML para el popup
            const popupContenedor = document.createElement('div');
            popupContenedor.style.textAlign = 'center';
            
            // Título del Apiario
            const titulo = document.createElement('h4');
            titulo.style.margin = '0 0 8px 0';
            titulo.innerHTML = `<strong>Apiario:</strong> ${apiario.name}`;
            popupContenedor.appendChild(titulo);

            // Botón de "Ver detalles"
            const botonDetalles = document.createElement('button');
            botonDetalles.innerText = 'Ver detalles';
            botonDetalles.className = 'btn-popup-detalles'; 
            botonDetalles.onclick = () => {
              this.router.navigate([`/apiarios/${apiario.id}`]);
            };
            popupContenedor.appendChild(botonDetalles);

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
              iconAnchor: [30, 45], // El ancla en la base del panal
              popupAnchor: [0, -40]
            });

            L.marker([apiario.latitude, apiario.longitude], { icon: markerIcon })
              .addTo(this.mapa)
              .bindPopup(popupContenedor); 
          }
        });
      },
      error: (err) => {
        console.error("Error al cargar los apiarios:", err);
      }
    });
  }

  // Método para obtener la ubicación del usuario
  getUbicacionActual() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coordenadas: [number, number] = [position.coords.latitude, position.coords.longitude];

        // Si el marcador ya existe movemos su posición. Si no, lo creamos
        if (this.userMarker) {
          this.userMarker.setLatLng(coordenadas).openPopup();
        } else {
          // Usamos el icono de usuario para no confundirlo con sus panales
          this.userMarker = L.marker(coordenadas, { icon: this.usuarioIcono })
            .addTo(this.mapa)
            .bindPopup("Estás aquí")
            .openPopup();
        }
        this.mapa.setView(coordenadas, 17);

      }, () => {
        alert("No se pudo obtener la ubicación actual. Revisa los permisos de tu navegador.");
      });
    } else {
      alert("Geolocalización no soportada por el navegador");
    }
  }
}

