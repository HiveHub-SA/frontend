import { AfterViewInit, Component, OnInit, inject, NgZone, ChangeDetectorRef} from '@angular/core';
import * as L from 'leaflet';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RutaManagerService } from '../ruta/ruta-manager.service';
import { RutaPanelComponent } from '../ruta/ruta.component';
import { ApiarioService } from '../apiarios/apiario.service';
import { RegistrarApiarioComponent } from '../registrar-apiario/registrar-apiario';
import { ModuloClimaticoComponent } from '../modulo-climatico/modulo-climatico';
import { AlertasClimaService } from '../modulo-climatico/alertas-clima.service';

@Component({
  selector: 'app-mapa-interactivo',
  imports: [RegistrarApiarioComponent, RouterOutlet, ModuloClimaticoComponent, CommonModule, RutaPanelComponent],
  templateUrl: './mapa-interactivo.html',
  styleUrl: './mapa-interactivo.css',
})

export class MapaInteractivo implements AfterViewInit, OnInit {
  
  //Inyectamos el servicio para las alertas climaticas
  public alertasService = inject(AlertasClimaService);

  //Atributos para el modulo climatico
  private ngZone = inject(NgZone);
  mostrarModuloClimatico: boolean = false;
  apiarioClimaSeleccionado: { nombre: string; lat: number; lng: number } | null = null;
  private cdr = inject(ChangeDetectorRef);

  //Atributos para el mapa y sus marcadores
  private mapa: any;
  private userMarker: L.Marker<any> | undefined;
  private apiariosMarkers: L.Marker[] = [];

  // Inyectamos el servicio del apiario usando inject
  private apiarioService = inject(ApiarioService);
  private router = inject(Router);
  rutaManager = inject(RutaManagerService);

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

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.iniciarMapa();
    this.cargarApiariosEnMapa(); // Llamamos a la carga de datos al iniciar el mapa
    if (this.rutaManager.rutaActiva()) {
      this.rutaManager.redibujarRuta(
        this.mapa,
        this.apiariosMarkers
      );
    }
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


private cargarApiariosEnMapa() {
  this.apiarioService.getAll().subscribe({
    next: (apiarios) => {

      // Mapeamos los apiarios al formato que consume AlertasClimaService
      const apiariosAdaptados = apiarios.map((a) => ({
        id: a.id,
        nombre: a.name,
        lat: a.latitude,
        lng: a.longitude,
      }));

      // Disparamos la evaluación climática para que el Header y el Toast se actualicen
      this.alertasService.evaluarApiarios(apiariosAdaptados);

      // A partir de aca empezamos a cargar cada apiario
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

          const botonRuta = document.createElement('button');
          botonRuta.className = 'btn-popup-detalles';
          botonRuta.style.marginTop = '8px';
          botonRuta.innerText = this.rutaManager.obtenerTextoBotonRuta();

          botonRuta.onclick = () => {
            if (
              this.rutaManager.esInicio(apiario) ||
              this.rutaManager.esDestino(apiario)
            ) {
              this.rutaManager.quitarDesdePopup(apiario);
            } else {
              this.rutaManager.agregarDesdePopup(apiario);
            }

            marker.closePopup();
            this.cargarApiariosEnMapa();
          };

          popupContenedor.appendChild(botonRuta);

          const orden = this.rutaManager.obtenerOrden(apiario);
          const nombre =
            this.rutaManager.rutaActiva() && orden !== null
              ? `${orden}. ${apiario.name}`
              : apiario.name;

          // Marcador HTML dinámico usando el diseño de extrusión y la etiqueta
          const markerIcon = L.divIcon({
            className: 'hive-marker-wrapper', // Clase principal invisible
            html: `
              <div class="hive-marker">
                <div class="hive-icon-bg">
                  <span class="material-symbols-outlined icono-panal" style="font-variation-settings: 'FILL' 1;">hive</span>
                </div>
                <div class="hive-label">${nombre}</div>
              </div>
            `,
            iconSize: [60, 60],
            iconAnchor: [30, 45], // El ancla en la base del panal
            popupAnchor: [0, -40],
          });

          const marker = L.marker(
            [apiario.latitude, apiario.longitude],
            { icon: markerIcon } as any
          )
            .addTo(this.mapa)
            .bindPopup(popupContenedor, {
              maxWidth: 160,
              minWidth: 130,
            });

          // Guardamos los datos del apiario en la instancia del marker
          (marker as any).apiarioData = apiario;

          marker.on('popupopen', () => {
            if (this.rutaManager.esInicio(apiario)) {
              botonRuta.innerText = 'Quitar inicio';
            } else if (this.rutaManager.esDestino(apiario)) {
              botonRuta.innerText = 'Quitar de la ruta';
            } else {
              botonRuta.innerText = this.rutaManager.obtenerTextoBotonRuta();
            }
          });

          this.apiariosMarkers.push(marker);
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

  onBotonRuta() {

    const habiaRuta = this.rutaManager.rutaActiva();

    this.rutaManager.manejarBotonRuta(
      this.mapa,
      this.apiariosMarkers
    );

    const intervalo = setInterval(() => {

      if (
        !this.rutaManager.calculandoRuta &&
        !habiaRuta &&
        this.rutaManager.rutaActiva()
      ) {

        clearInterval(intervalo);

        this.cargarApiariosEnMapa();

      }

    }, 100);

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

  limpiarRuta() {
    this.rutaManager.limpiarRuta(
      this.mapa,
      this.apiariosMarkers
    );
    this.cargarApiariosEnMapa();
  }
}