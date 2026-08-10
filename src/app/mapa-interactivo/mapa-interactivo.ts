import { AfterViewInit, Component, OnInit, inject, NgZone, ChangeDetectorRef} from '@angular/core';
import * as L from 'leaflet';
import { Router, RouterOutlet } from '@angular/router';
import { ApiarioService } from '../apiarios/apiario.service';
import { RegistrarApiarioComponent } from '../registrar-apiario/registrar-apiario';
import { ModuloClimaticoComponent } from '../modulo-climatico/modulo-climatico';

@Component({
  selector: 'app-mapa-interactivo',
  imports: [RegistrarApiarioComponent, RouterOutlet, ModuloClimaticoComponent],
  templateUrl: './mapa-interactivo.html',
  styleUrl: './mapa-interactivo.css',
})
export class MapaInteractivo implements AfterViewInit, OnInit {
  
  //Atributos para el modulo climatico
  private ngZone = inject(NgZone);
  mostrarModuloClimatico: boolean = false;
  apiarioClimaSeleccionado: { nombre: string; lat: number; lng: number } | null = null;
  private cdr = inject(ChangeDetectorRef);

  //Atributos para el mapa y sus marcadores
  private mapa: any;
  private userMarker: L.Marker<any> | undefined;

  // Inyectamos el servicio del apiario usando inject
  private apiarioService = inject(ApiarioService);
  private router = inject(Router);

  // Icono por defecto para la ubicacion del usuario
  private usuarioIcono = L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.iniciarMapa();
    this.cargarApiariosEnMapa(); // Llamamos a la carga de datos al iniciar el mapa
  }

  private iniciarMapa() {
    // Render del mapa centrado en Villa Maria
    this.mapa = L.map('mapa', {
      zoomControl: false,
    }).setView([-32.4103, -63.2314], 14);

    // Capa segura con las políticas obligatorias
    const capaCarto = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    );
    capaCarto.addTo(this.mapa);

    //Esto es para el modulo climatico
    this.mapa.on('popupopen', (e: any) => {
      const container = e.popup.getElement();
      const btnClima = container?.querySelector('.btn-popup-clima');

      if (btnClima) {
        btnClima.onclick = () => {
          const apiario = e.popup._source?.options?.apiarioData || e.popup._source?.apiarioData;
          
          console.log('Apiario capturado en clic:', apiario);

          if (apiario) {
            this.ngZone.run(() => {
              this.apiarioClimaSeleccionado = {
                nombre: apiario.name,
                lat: apiario.latitude,
                lng: apiario.longitude,
              };
              this.mostrarModuloClimatico = true;
              
              // FORZAMOS A ANGULAR A RENDERIZAR EL CAMBIO
              this.cdr.detectChanges(); 
            });
          }
        };
      }
    });
    
    //Timeout para que cargue bien el mapa 
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

  // // Método que trae los apiarios del backend y los dibuja
  // private cargarApiariosEnMapa() {
  //   this.apiarioService.getAll().subscribe({
  //     next: (apiario) => {
  //       apiario.forEach((apiario) => {
  //         if (apiario.latitude && apiario.longitude) {
  //           // Creación del contenedor HTML para el popup
  //           const popupContenedor = document.createElement('div');
  //           popupContenedor.style.textAlign = 'center';

  //           // Título del Apiario
  //           const titulo = document.createElement('h4');
  //           titulo.style.margin = '0 0 8px 0';
  //           titulo.innerHTML = `<strong>Apiario:</strong> ${apiario.name}`;
  //           // popupContenedor.appendChild(titulo);

  //           // Botón de "Ver detalles"
  //           const botonDetalles = document.createElement('button');
  //           botonDetalles.innerText = 'Ver detalles';
  //           botonDetalles.className = 'btn-popup-detalles';
  //           botonDetalles.onclick = () => {
  //             this.router.navigate([`/apiarios/${apiario.id}`]);
  //           };
  //           popupContenedor.appendChild(botonDetalles);

  //           // Botón de "Ver tiempo"
  //           const botonClima = document.createElement('button');
  //           botonClima.innerText = 'Ver tiempo';
  //           botonClima.className = 'btn-popup-detalles btn-popup-clima';
  //           botonClima.onclick = () => {
  //             this.ngZone.run(() => {
  //               this.apiarioClimaSeleccionado = {
  //                 nombre: apiario.name,
  //                 lat: apiario.latitude,
  //                 lng: apiario.longitude,
  //               };
  //               this.mostrarModuloClimatico = true;
  //             });
  //           };
  //           popupContenedor.appendChild(botonClima);


  //           // Marcador HTML dinámico usando el diseño de extrusión y la etiqueta
  //           const markerIcon = L.divIcon({
  //             className: 'hive-marker-wrapper', // Clase principal invisible
  //             html: `
  //               <div class="hive-marker">
  //                 <div class="hive-icon-bg">
  //                   <span class="material-symbols-outlined icono-panal" style="font-variation-settings: 'FILL' 1;">hive</span>
  //                 </div>
  //                 <div class="hive-label">${apiario.name}</div>
  //               </div>
  //             `,
  //             iconSize: [60, 60],
  //             iconAnchor: [30, 45], // El ancla en la base del panal
  //             popupAnchor: [0, -40],
  //           });

  //           L.marker([apiario.latitude, apiario.longitude], { icon: markerIcon })
  //             .addTo(this.mapa)
  //             .bindPopup(popupContenedor);
              
  //         }
          
  //       });
  //     },
  //     error: (err) => {
  //       console.error('Error al cargar los apiarios:', err);
  //     },
  //   });
  // }

  private cargarApiariosEnMapa() {
  this.apiarioService.getAll().subscribe({
    next: (apiarios) => {
      apiarios.forEach((apiario) => {
      if (apiario.latitude && apiario.longitude) {
        const popupContenedor = document.createElement('div');
        popupContenedor.style.textAlign = 'center';

        const botonDetalles = document.createElement('button');
        botonDetalles.innerText = 'Ver detalles';
        botonDetalles.className = 'btn-popup-detalles';
        botonDetalles.onclick = () => {
          this.router.navigate([`/apiarios/${apiario.id}`]);
        };
        popupContenedor.appendChild(botonDetalles);

        const botonClima = document.createElement('button');
        botonClima.innerText = 'Ver tiempo';
        botonClima.className = 'btn-popup-detalles btn-popup-clima';
        popupContenedor.appendChild(botonClima);

        const markerIcon = L.divIcon({
          className: 'hive-marker-wrapper',
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

        // Guardamos los datos tanto en las opciones como en la instancia
        const marker = L.marker([apiario.latitude, apiario.longitude], { 
          icon: markerIcon,
          apiarioData: apiario 
        } as any).addTo(this.mapa).bindPopup(popupContenedor);

        (marker as any).apiarioData = apiario;
      }
      });
    },
    error: (err) => {
      console.error('Error al cargar los apiarios:', err);
    },
  });
}

  // Método para obtener la ubicación del usuario
  getUbicacionActual() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordenadas: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];

          // Si el marcador ya existe movemos su posición. Si no, lo creamos
          if (this.userMarker) {
            this.userMarker.setLatLng(coordenadas).openPopup();
          } else {
            // Usamos el icono de usuario para no confundirlo con sus panales
            this.userMarker = L.marker(coordenadas, { icon: this.usuarioIcono })
              .addTo(this.mapa)
              .bindPopup('Estás aquí');
          }
          this.mapa.setView(coordenadas, 17);
        },
        () => {
          alert('No se pudo obtener la ubicación actual. Revisa los permisos de tu navegador.');
        },
      );
    } else {
      alert('Geolocalización no soportada por el navegador');
    }
  }

  // estado que controla si el popup está abierto
  mostrarRegistrarApiario = false;

  onAnadirApiario() {
    this.mostrarRegistrarApiario = true;
  }

  onApiarioCreado(apiario: any) {
    this.mostrarRegistrarApiario = false;
    this.cargarApiariosEnMapa();
  }

  onApiarioCancelado() {
    this.mostrarRegistrarApiario = false;
  }
}

