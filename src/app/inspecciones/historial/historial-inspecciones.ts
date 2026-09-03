import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InspeccionDTO } from '../inspeccion.model';
import { InspeccionService } from '../inspeccion.service';
import { ApiarioService } from '../../apiarios/apiario.service';
import { ApiarioDTO } from '../../apiarios/apiario.model';
import { NavbarComponent } from '../../navbar/navbar.component';
import { IndexedDbAudioService } from '../../audio-recorder/services/indexed-db-audio.service';
import { InspeccionDraftService } from '../inspeccion-draft.service';

/**
 * Componente que gestiona la pantalla del Historial de Inspecciones del Apiario.
 * Muestra el listado de inspecciones previas (en borrador o sincronizadas),
 * la floración registrada y el botón para iniciar o retomar una inspección.
 */
@Component({
  selector: 'app-historial-inspecciones',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './historial-inspecciones.html',
  styleUrl: './historial-inspecciones.css',
})
export class HistorialInspeccionesComponent implements OnInit {
  /** ID del apiario obtenido desde la URL (/apiarios/:id/inspecciones) */
  apiarioId!: number;

  /** Estado con la información del apiario actual */
  apiario = signal<ApiarioDTO | null>(null);

  /** Estado con la lista de inspecciones del apiario */
  inspecciones = signal<InspeccionDTO[]>([]);

  /** Estado de carga */
  loading = signal<boolean>(true);

  /** ID de la inspección actualmente deslizada hacia la izquierda */
  swipedCardId = signal<number | null>(null);

  /** ID de la tarjeta que se está arrastrando en este instante */
  activeDragCardId = signal<number | null>(null);

  /** Registro de desplazamiento en px para la tarjeta activa */
  dragOffsets = signal<{ [key: number]: number }>({});

  /** Inspección seleccionada para confirmación de eliminación de seguridad */
  inspeccionAEliminar = signal<InspeccionDTO | null>(null);

  private startX: number = 0;
  private isMouseDown: boolean = false;
  private initialOffset: number = 0;
  private hasDragged: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiarioService: ApiarioService,
    private inspeccionService: InspeccionService,
    private indexedDbAudio: IndexedDbAudioService,
    private draftService: InspeccionDraftService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    this.apiarioId = Number(idParam);

    if (this.apiarioId) {
      this.cargarDatos();
    }
  }

  /**
   * Carga los datos del apiario y su historial de inspecciones desde los servicios.
   */
  cargarDatos(): void {
    this.loading.set(true);
    this.apiarioService.getApiarioById(this.apiarioId).subscribe({
      next: (data) => this.apiario.set(data),
      error: (err) => console.error('Error al obtener apiario:', err),
    });

    this.inspeccionService.getInspeccionesByApiario(this.apiarioId).subscribe({
      next: (list) => {
        this.inspecciones.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener historial de inspecciones:', err);
        this.loading.set(false);
      },
    });
  }

  /**
   * Manejador al hacer clic en una tarjeta de inspección.
   */
  verInspeccion(inspeccion: InspeccionDTO): void {
    // Si se realizó un arrastre o la tarjeta está deslizada, cerrar swipe en lugar de navegar
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }

    if (this.swipedCardId() === inspeccion.id) {
      this.swipedCardId.set(null);
      return;
    }

    if (inspeccion.estado === 'EN_BORRADOR' && inspeccion.id) {
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
        queryParams: { inspeccionId: inspeccion.id }
      });
    } else if (inspeccion.id) {
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', inspeccion.id]);
    }
  }

  /**
   * Redirige a la pantalla de Nueva Inspección.
   */
  crearNuevaInspeccion(): void {
    const borradorExistente = this.inspecciones().find((i) => i.estado === 'EN_BORRADOR');

    if (borradorExistente && borradorExistente.id) {
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
        queryParams: { inspeccionId: borradorExistente.id }
      });
    } else {
      const inspeccionesExistentes = this.inspecciones();
      const ultimaFloracion = inspeccionesExistentes.length > 0 && inspeccionesExistentes[0].floracion
        ? inspeccionesExistentes[0].floracion
        : 'Girasol';

      this.inspeccionService
        .createInspeccion(this.apiarioId, {
          fecha: new Date().toISOString(),
          floracion: ultimaFloracion,
          estado: 'EN_BORRADOR',
          apiarioId: this.apiarioId
        })
        .subscribe({
          next: (nuevaInsp) => {
            this.draftService.clearDraft(this.apiarioId);
            this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
              queryParams: { inspeccionId: nuevaInsp.id }
            });
          },
          error: (err) => {
            console.error('Error al crear nuevo borrador de inspección:', err);
            this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva']);
          }
        });
    }
  }

  /**
   * Formatea cadenas de fecha ISO a un formato amigable en español (ej. "30 de Julio, 2026").
   */
  formatFecha(fechaIso: string): string {
    try {
      const date = new Date(fechaIso);
      const dia = date.getDate();
      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const mes = meses[date.getMonth()];
      const anio = date.getFullYear();
      return `${dia} de ${mes}, ${anio}`;
    } catch {
      return fechaIso;
    }
  }

  /* ARRASTRE Y SWIPE EXCLUSIVAMENTE HORIZONTAL */
  onDragStart(event: TouchEvent | MouseEvent, id?: number): void {
    if (!id) return;
    this.isMouseDown = true;
    this.hasDragged = false;
    this.activeDragCardId.set(id);
    this.startX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX;
    this.initialOffset = this.swipedCardId() === id ? -100 : 0;
  }

  onDragMove(event: TouchEvent | MouseEvent, id?: number): void {
    if (!this.isMouseDown || !id || this.activeDragCardId() !== id) return;
    const currentX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX;
    const diffX = currentX - this.startX;

    if (Math.abs(diffX) > 8) {
      this.hasDragged = true;
    }

    let newOffset = this.initialOffset + diffX;
    if (newOffset > 0) newOffset = 0;
    if (newOffset < -100) newOffset = -100;

    this.dragOffsets.update((map) => ({ ...map, [id]: newOffset }));
  }

  onDragEnd(event?: TouchEvent | MouseEvent, id?: number): void {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;

    const targetId = id || this.activeDragCardId();
    if (!targetId) return;

    const currentOffset = this.dragOffsets()[targetId] ?? this.initialOffset;

    if (currentOffset <= -45) {
      this.swipedCardId.set(targetId);
    } else {
      if (this.swipedCardId() === targetId) {
        this.swipedCardId.set(null);
      }
    }

    this.activeDragCardId.set(null);
    this.dragOffsets.update((map) => {
      const copy = { ...map };
      delete copy[targetId];
      return copy;
    });
  }

  getCardTransform(id?: number): string {
    if (!id) return 'translateX(0px)';
    if (this.activeDragCardId() === id && this.dragOffsets()[id] !== undefined) {
      return `translateX(${this.dragOffsets()[id]}px)`;
    }
    if (this.swipedCardId() === id) {
      return 'translateX(-100px)';
    }
    return 'translateX(0px)';
  }

  pedirConfirmacionEliminar(inspeccion: InspeccionDTO, event: MouseEvent): void {
    event.stopPropagation();
    this.inspeccionAEliminar.set(inspeccion);
  }

  cancelarEliminacion(): void {
    this.inspeccionAEliminar.set(null);
    this.swipedCardId.set(null);
  }

  confirmarEliminacion(): void {
    const target = this.inspeccionAEliminar();
    if (!target || !target.id) return;

    this.inspeccionService.deleteInspeccion(target.id).subscribe({
      next: async () => {
        await this.indexedDbAudio.deleteAudiosByInspeccion(target.id!);
        const localDraft = this.draftService.getDraft(this.apiarioId);
        if (localDraft && (localDraft.inspeccionId === target.id || target.estado === 'EN_BORRADOR')) {
          this.draftService.clearDraft(this.apiarioId);
        }
        this.inspecciones.set(this.inspecciones().filter((i) => i.id !== target.id));
        this.inspeccionAEliminar.set(null);
        this.swipedCardId.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar inspección:', err);
        this.inspeccionAEliminar.set(null);
      }
    });
  }
}
