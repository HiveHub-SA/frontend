import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiarioService } from '../../apiarios/apiario.service';
import { ApiarioDTO } from '../../apiarios/apiario.model';
import { InspeccionService } from '../inspeccion.service';
import { ColmenaEstadoInspeccion, OPCIONES_FLORACION, TipoFloracion } from '../inspeccion.model';
import { NavbarComponent } from '../../navbar/navbar.component';

/**
 * Componente para la pantalla de Nueva Inspección (o edición de Borrador existente).
 * Permite visualizar y editar la Floración Predominante del apiario (US 35),
 * mantener la sesión en estado "EN_BORRADOR" si el usuario sale o retrocede,
 * y cambiar su estado a "SINCRONIZADA" al presionar "FINALIZAR INSPECCIÓN".
 */
@Component({
  selector: 'app-nueva-inspeccion',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './nueva-inspeccion.html',
  styleUrl: './nueva-inspeccion.css',
})
export class NuevaInspeccionComponent implements OnInit {
  /** ID del apiario recibido por parámetro de ruta */
  apiarioId!: number;

  /** ID opcional de la inspección en borrador activa */
  inspeccionId: number | null = null;

  /** Datos del apiario actual */
  apiario = signal<ApiarioDTO | null>(null);

  /** Fecha actual en formato DD/MM/YYYY */
  fechaActual: string = '';

  /** Floración predominante seleccionada (US 35) */
  floracionActual = signal<string>('Girasol');

  /** Valor original de la floración precargada */
  floracionOriginal: string = 'Girasol';

  /** Controla la visibilidad del modal/desplegable para cambiar el tipo de floración */
  mostrarSelectorFloracion = signal<boolean>(false);

  /** Opciones de floración disponibles (Girasol, Eucalipto, Trébol, Alfalfa, Citrus, Monte Nativo, Multifloral) */
  opcionesFloracion = OPCIONES_FLORACION;

  /** Lista de colmenas con sus estados de inspección */
  colmenasEstado = signal<ColmenaEstadoInspeccion[]>([]);

  /** Estado de carga de la pantalla */
  loading = signal<boolean>(true);

  /** Indicador persistente del estado de conexión (Offline) */
  isOffline = signal<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiarioService: ApiarioService,
    private inspeccionService: InspeccionService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    this.apiarioId = Number(idParam);

    const queryInspeccionId = this.route.snapshot.queryParams['inspeccionId'];
    if (queryInspeccionId) {
      this.inspeccionId = Number(queryInspeccionId);
    }

    // Formatear fecha actual
    const date = new Date();
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    this.fechaActual = `${dia}/${mes}/${anio}`;

    if (this.apiarioId) {
      this.cargarDatosApiario();
    }
  }

  /**
   * Carga los datos del apiario y la inspección en borrador si existe.
   */
  cargarDatosApiario(): void {
    this.loading.set(true);
    this.apiarioService.getApiarioById(this.apiarioId).subscribe({
      next: (data) => {
        this.apiario.set(data);
        this.prepararColmenas(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar apiario para nueva inspección:', err);
        const mockApiario: ApiarioDTO = {
          id: this.apiarioId,
          name: 'El Trébol',
          createdAt: new Date().toISOString(),
          latitude: -34.6037,
          longitude: -58.3816,
          colmenas: [
            { id: 1, name: 'Colmena #01' },
            { id: 2, name: 'Colmena #02' },
            { id: 3, name: 'Colmena #03' },
            { id: 4, name: 'Colmena #04' }
          ]
        };
        this.apiario.set(mockApiario);
        this.prepararColmenas(mockApiario);
        this.loading.set(false);
      }
    });

    // Si viene inspeccionId, obtener sus datos específicos; de lo contrario buscar el último borrador
    if (this.inspeccionId) {
      this.inspeccionService.getInspeccionById(this.inspeccionId).subscribe({
        next: (insp) => {
          if (insp && insp.floracion) {
            this.floracionActual.set(insp.floracion);
            this.floracionOriginal = insp.floracion;
          }
        }
      });
    } else {
      this.inspeccionService.getInspeccionesByApiario(this.apiarioId).subscribe({
        next: (list) => {
          if (!list || list.length === 0) return;

          const borrador = list.find((i) => i.estado === 'EN_BORRADOR');
          if (borrador) {
            this.inspeccionId = borrador.id || null;
            if (borrador.floracion) {
              this.floracionActual.set(borrador.floracion);
              this.floracionOriginal = borrador.floracion;
            }
          } else {
            // Cargar la floración del registro más reciente del apiario (ya viene ordenado por fecha desc)
            const ultima = list[0];
            if (ultima && ultima.floracion) {
              this.floracionActual.set(ultima.floracion);
              this.floracionOriginal = ultima.floracion;
            }
          }
        }
      });
    }
  }

  /**
   * Prepara la lista de colmenas asignándoles su estado de revisión.
   */
  prepararColmenas(apiario: ApiarioDTO): void {
    const colmenas = apiario.colmenas || [];
    const estados: ColmenaEstadoInspeccion[] = colmenas.map((c, index) => {
      const id = (c['id'] as number) || index + 1;
      const name = (c['name'] as string) || `Colmena #${String(index + 1).padStart(2, '0')}`;
      const completada = index === 0;
      return {
        id,
        name,
        completada,
        estadoTexto: completada ? '✓ Inspección guardada' : 'Pendiente de revisión'
      };
    });
    this.colmenasEstado.set(estados);
  }

  /**
   * Total de colmenas completadas.
   */
  get totalCompletadas(): number {
    return this.colmenasEstado().filter((c) => c.completada).length;
  }

  /**
   * Mantiene la floración predominante activa.
   */
  mantenerFloracion(): void {
    this.mostrarSelectorFloracion.set(false);
  }

  /**
   * Abre el modal/desplegable para cambiar el tipo de floración.
   */
  abrirSelectorFloracion(): void {
    this.mostrarSelectorFloracion.set(true);
  }

  /**
   * Selecciona una nueva variedad de floración y la guarda en el borrador (US 35).
   */
  seleccionarFloracion(opcion: TipoFloracion): void {
    this.floracionActual.set(opcion);
    this.mostrarSelectorFloracion.set(false);

    // Guardado continuo en el borrador si existe el ID de la inspección
    if (this.inspeccionId) {
      this.inspeccionService.updateFloracion(this.inspeccionId, opcion).subscribe({
        next: () => console.log('Floración actualizada en el borrador:', opcion),
        error: (err) => console.error('Error al actualizar floración:', err)
      });
    }
  }

  /**
   * Manejador al seleccionar una tarjeta de colmena para inspeccionarla.
   */
  seleccionarColmena(colmena: ColmenaEstadoInspeccion): void {
    console.log('Navegar a inspección de colmena:', colmena);
  }

  /**
   * Finaliza la inspección cambiando el estado del borrador de "EN_BORRADOR" a "SINCRONIZADA".
   */
  finalizarInspeccion(): void {
    if (this.inspeccionId) {
      this.inspeccionService.finalizarInspeccion(this.inspeccionId).subscribe({
        next: () => {
          this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones']);
        },
        error: (err) => {
          console.error('Error al finalizar inspección:', err);
          this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones']);
        }
      });
    } else {
      this.inspeccionService
        .createInspeccion(this.apiarioId, {
          fecha: new Date().toISOString(),
          floracion: this.floracionActual(),
          estado: 'SINCRONIZADA',
          apiarioId: this.apiarioId
        })
        .subscribe({
          next: () => {
            this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones']);
          },
          error: (err) => {
            console.error('Error al crear y finalizar inspección:', err);
            this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones']);
          }
        });
    }
  }
}
