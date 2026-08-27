import { AfterViewInit, Component, OnInit, OnDestroy, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import * as L from 'leaflet';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
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
export class MapaInteractivo implements AfterViewInit, OnInit, OnDestroy {
  // Inyección de servicios
  public alertasService = inject(AlertasClimaService);
  private apiarioService = inject(ApiarioService);
  private router = inject(Router);
  public rutaManager = inject(RutaManagerService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  // Atributos para el módulo climático
  mostrarModuloClimatico: boolean = false;
  apiarioClimaSeleccionado: { nombre: string; lat: number; lng: number } | null = null;

  // Atributos para el mapa y marcadores
  private mapa: any;
  private userMarker: L.Marker<any> | undefined;
  private apiariosMarkers: L.Marker[] = [];
  private subEnfoqueAlerta?: Subscription;

  // Ícono de ubicación del usuario
  private usuarioIcono = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.iniciarMapa();
    this.escucharSeleccionDeAlertas();
    this.cargarApiariosEnMapa();

    if (this.rutaManager.rutaActiva()) {
      this.rutaManager.redibujarRuta(this.mapa, this.apiariosMarkers);
    }
  }

  ngOnDestroy(): void {
    this.subEnfoqueAlerta?.unsubscribe();
  }

  //Metodo para renderizar el mapa cuando se abre la aplicacion
private iniciarMapa() {
  //Configuración del mapa con animaciones activas
  this.mapa = L.map('mapa', {
    zoomControl: false,
    fadeAnimation: true,
    zoomAnimation: true,
  }).setView([-32.4103, -63.2314], 14);

  //Capa de mapa cartografico Esri 
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

  //Se utiliza para corregir dimensiones del contenedor en la carga inicial
  requestAnimationFrame(() => {
    this.mapa.invalidateSize();
  });


    // Manejo de clic en botón de clima dentro de cualquier popup
    this.mapa.on('popupopen', (e: any) => {
      const container = e.popup.getElement();
      const btnClima = container?.querySelector('.btn-popup-clima');

      if (btnClima) {
        btnClima.onclick = () => {
          const apiario = e.popup._source?.options?.apiarioData || e.popup._source?.apiarioData;

          if (apiario) {
            this.ngZone.run(() => {
              this.apiarioClimaSeleccionado = {
                nombre: apiario.name,
                lat: apiario.latitude,
                lng: apiario.longitude,
              };
              this.mostrarModuloClimatico = true;
              this.cdr.detectChanges();
            });
          }
        };
      }
    });

    setTimeout(() => {
      this.mapa.invalidateSize();
    }, 100);
  }

  // Escucha selecciones de alertas desde el panel flotante global
  private escucharSeleccionDeAlertas(): void {
    this.subEnfoqueAlerta = this.alertasService.enfocarApiario$.subscribe((alerta) => {
      if (alerta && this.mapa) {
        this.enfocarApiarioNotificado(alerta);
      }
    });
  }

  //Funcionalidad para ir al apiario desde una alerta
  private enfocarApiarioNotificado(alerta: any): void {
    const lat = alerta.latitud ?? alerta.lat;
    const lng = alerta.longitud ?? alerta.lng;
    const apiarioId = alerta.apiarioId ?? alerta.id;

    if (!lat || !lng) return;

    // Centramos el mapa suavemente en la ubicación del apiario
    this.mapa.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });

    // Cuando termina la animación, desplegamos el popup del apiario correspondiente
    setTimeout(() => {
      const marker = this.apiariosMarkers.find(
        (m: any) => m.apiarioData?.id === apiarioId
      );if (marker) {
        marker.openPopup();
      }this.alertasService.limpiarEnfoque();}, 1300);
  }

  // --- CARGA Y RENDERIZADO MODULARIZADO DE APIARIOS ---
  private cargarApiariosEnMapa(): void {
    this.apiarioService.getAll().subscribe({
      next: (apiarios) => {
        this.actualizarAlertasClima(apiarios);
        this.limpiarMarcadoresApiarios();
        this.renderizarApiarios(apiarios);

        // Verificamos si había un enfoque pendiente al momento de armar el componente
        const alertaPendiente = this.alertasService.obtenerAlertaPendiente();
        if (alertaPendiente) {
          this.enfocarApiarioNotificado(alertaPendiente);
        }
      },
      error: (err) => console.error('Error al cargar los apiarios:', err),
    });
  }

  //Metodo para cargar las alertas climaticas
  private actualizarAlertasClima(apiarios: any[]): void {
    const apiariosAdaptados = apiarios.map((a) => ({
      id: a.id,
      nombre: a.name,
      lat: a.latitude,
      lng: a.longitude,
    }));
    this.alertasService.evaluarApiarios(apiariosAdaptados);
  }

  //Metodo para reiniciar los marcadores de los apiarios
  private limpiarMarcadoresApiarios(): void {
    this.apiariosMarkers.forEach((marker) => marker.remove());
    this.apiariosMarkers = [];
  }

  //Se cargan los apiarios en el mapa con los marcadores limpios
  private renderizarApiarios(apiarios: any[]): void {
    apiarios.forEach((apiario) => {
      if (apiario.latitude && apiario.longitude) {
        const marker = this.crearMarcadorApiario(apiario);
        marker.addTo(this.mapa);
        this.apiariosMarkers.push(marker);
      }
    });
  }

  //Se instancian los marcadores con los estilos especificados en la ubicacion del apiario
  private crearMarcadorApiario(apiario: any): L.Marker {
    const orden = this.rutaManager.obtenerOrden(apiario);
    const nombre =
      this.rutaManager.rutaActiva() && orden !== null
        ? `${orden}. ${apiario.name}`
        : apiario.name;

    const markerIcon = L.divIcon({
      className: 'hive-marker-wrapper',
      html: `
        <div class="hive-marker">
          <div class="hive-icon-bg">
            <span class="material-symbols-outlined icono-panal" style="font-variation-settings: 'FILL' 1;">hive</span>
          </div>
          <div class="hive-label">${nombre}</div>
        </div>
      `,
      iconSize: [60, 60],
      iconAnchor: [30, 45],
      popupAnchor: [0, -40],
    });

    const popupContenedor = this.crearContenidoPopup(apiario);

    const marker = L.marker([apiario.latitude, apiario.longitude], {
      icon: markerIcon,
      apiarioData: apiario,
    } as any).bindPopup(popupContenedor, {
      maxWidth: 160,
      minWidth: 130,
    });

    (marker as any).apiarioData = apiario;

    marker.on('popupopen', () => {
      this.actualizarTextoBotonRutaInPopup(popupContenedor, apiario);
    });

    return marker;
  }

  //Se crean los botones dentro del popup del marcador perteneciente a cada apiario
  private crearContenidoPopup(apiario: any): HTMLElement {
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
    botonRuta.className = 'btn-popup-detalles btn-popup-ruta';
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
      this.cargarApiariosEnMapa();
    };

    popupContenedor.appendChild(botonRuta);
    return popupContenedor;
  }

  //Se acutaliza el boton asociado a las rutas una vez que el apiario fue seleccionado
  private actualizarTextoBotonRutaInPopup(container: HTMLElement, apiario: any): void {
    const botonRuta = container.querySelector('.btn-popup-ruta') as HTMLButtonElement;
    if (!botonRuta) return;

    if (this.rutaManager.esInicio(apiario)) {
      botonRuta.innerText = 'Quitar inicio';
    } else if (this.rutaManager.esDestino(apiario)) {
      botonRuta.innerText = 'Quitar de la ruta';
    } else {
      botonRuta.innerText = this.rutaManager.obtenerTextoBotonRuta();
    }
  }

  // --- CONTROLES DE ZOOM Y UBICACIÓN ---

  //Metodos asociados a los botones para hacer zoom o quitarlo dentro del mapa
  zoomIn() {
    if (this.mapa) this.mapa.zoomIn();
  }
  zoomOut() {
    if (this.mapa) this.mapa.zoomOut();
  }

  //Metodo para obtener la ubicacion actual del usuario
  getUbicacionActual() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordenadas: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];

          if (this.userMarker) {
            this.userMarker.setLatLng(coordenadas).openPopup();
          } else {
            this.userMarker = L.marker(coordenadas, { icon: this.usuarioIcono })
              .addTo(this.mapa)
              .bindPopup('Estás aquí');
          }
          this.mapa.setView(coordenadas, 17);
        },
        () => {
          alert('No se pudo obtener la ubicación actual. Revisa los permisos de tu navegador.');
        }
      );
    } else {
      alert('Geolocalización no soportada por el navegador');
    }
  }

  //Funcionalidad del boton para cargar las rutas
  onBotonRuta() {
    const habiaRuta = this.rutaManager.rutaActiva();
    this.rutaManager.manejarBotonRuta(this.mapa, this.apiariosMarkers);

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

  // Modales
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
    this.rutaManager.limpiarRuta(this.mapa, this.apiariosMarkers);
    this.cargarApiariosEnMapa();
  }
}