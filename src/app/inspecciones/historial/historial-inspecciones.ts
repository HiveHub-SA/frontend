import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InspeccionDTO } from '../inspeccion.model';
import { InspeccionService } from '../inspeccion.service';
import { ApiarioService } from '../../apiarios/apiario.service';
import { ApiarioDTO } from '../../apiarios/apiario.model';
import { NavbarComponent } from '../../navbar/navbar.component';
import { IndexedDbAudioService } from '../../audio-recorder/services/indexed-db-audio.service';
import { InspeccionDraftService } from '../inspeccion-draft.service';
import { OfflineCacheService } from '../../shared/services/offline-cache.service';
import { InspeccionSyncService } from '../services/inspeccion-sync.service';
import { NetworkStatusService } from '../../shared/services/network-status.service';

/**
 * Componente que gestiona la pantalla del Historial de Inspecciones del Apiario.
 * Muestra el listado de inspecciones previas (en borrador o sincronizadas),
 * la floración registrada y el botón para iniciar o retomar una inspección con soporte offline (US 05).
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
    private draftService: InspeccionDraftService,
    private offlineCache: OfflineCacheService,
    public syncService: InspeccionSyncService,
    public networkStatus: NetworkStatusService
  ) {
    effect(() => {
      // Reaccionar automáticamente a cambios de conectividad y cola offline
      const _ = this.syncService.pendingCount();
      const __ = this.networkStatus.online();
      if (this.apiarioId) {
        this.cargarDatos();
      }
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    this.apiarioId = Number(idParam);

    if (this.apiarioId) {
      this.cargarDatos();
    }
  }

  /**
   * Carga los datos del apiario y su historial de inspecciones desde los servicios o caché local.
   */
  cargarDatos(): void {
    this.loading.set(true);

    // Cargar datos del Apiario (con fallback offline)
    this.apiarioService.getApiarioById(this.apiarioId).subscribe({
      next: (data) => {
        if (data) {
          this.apiario.set(data);
        } else {
          const cached = this.offlineCache.getCachedApiarioById(this.apiarioId);
          if (cached) this.apiario.set(cached);
        }
      },
      error: (err) => {
        console.warn('Recuperando apiario desde caché offline:', err);
        const cached = this.offlineCache.getCachedApiarioById(this.apiarioId);
        if (cached) this.apiario.set(cached);
      }
    });

    // Construir lista local (borrador activo + cola offline)
    const localDraftList = this.obtenerBorradoresLocales();
    const queuedList = this.obtenerInspeccionesEncoladas();

    if (this.networkStatus.online()) {
      this.inspeccionService.getInspeccionesByApiario(this.apiarioId).subscribe({
        next: (serverList) => {
          // Si el servidor ya tiene un borrador, no duplicar con el local
          const hasServerDraft = serverList.some(i => i.estado === 'EN_BORRADOR');
          const draftsToAdd = hasServerDraft ? [] : localDraftList;

          const combined = [...draftsToAdd, ...queuedList, ...serverList];
          this.inspecciones.set(combined);
          this.loading.set(false);
        },
        error: (err) => {
          console.warn('Conexión no disponible para historial, mostrando registros locales:', err);
          this.inspecciones.set([...localDraftList, ...queuedList]);
          this.loading.set(false);
        }
      });
    } else {
      // Modo Offline directo
      this.inspecciones.set([...localDraftList, ...queuedList]);
      this.loading.set(false);
    }
  }

  private obtenerBorradoresLocales(): InspeccionDTO[] {
    const localDraft = this.draftService.getDraft(this.apiarioId);
    if (!localDraft) return [];

    return [{
      id: localDraft.inspeccionId || -1,
      apiarioId: this.apiarioId,
      fecha: localDraft.fecha || localDraft.lastUpdated || new Date().toISOString(),
      floracion: localDraft.floracion || 'Girasol',
      varroa: localDraft.varroa || 'NO_DETECTADA',
      estado: 'EN_BORRADOR'
    }];
  }

  private obtenerInspeccionesEncoladas(): InspeccionDTO[] {
    return this.syncService.getPendingQueue()
      .filter(q => q.apiarioId === this.apiarioId)
      .map((q, idx) => ({
        id: -(idx + 100),
        uuidLocal: q.uuid,
        apiarioId: q.apiarioId,
        fecha: q.fecha,
        floracion: q.floracion,
        varroa: q.varroa,
        estado: 'PENDIENTE_SINCRONIZACION' as const
      }));
  }

  /**
   * Manejador al hacer clic en una tarjeta de inspección.
   */
  verInspeccion(inspeccion: InspeccionDTO): void {
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }

    if (this.swipedCardId() === inspeccion.id) {
      this.swipedCardId.set(null);
      return;
    }

    if (inspeccion.estado === 'EN_BORRADOR') {
      const qParams = inspeccion.id && inspeccion.id > 0 ? { inspeccionId: inspeccion.id } : undefined;
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
        queryParams: qParams
      });
    } else if (inspeccion.id && inspeccion.id > 0) {
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', inspeccion.id]);
    }
  }

  /**
   * Redirige a la pantalla de Nueva Inspección o retoma el borrador existente.
   */
  crearNuevaInspeccion(): void {
    const borradorLocal = this.draftService.getDraft(this.apiarioId);
    const borradorExistente = this.inspecciones().find((i) => i.estado === 'EN_BORRADOR');

    if (borradorExistente) {
      const qParams = borradorExistente.id && borradorExistente.id > 0
        ? { inspeccionId: borradorExistente.id }
        : undefined;
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
        queryParams: qParams
      });
    } else if (borradorLocal) {
      const qParams = borradorLocal.inspeccionId && borradorLocal.inspeccionId > 0
        ? { inspeccionId: borradorLocal.inspeccionId }
        : undefined;
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
        queryParams: qParams
      });
    } else if (this.networkStatus.online()) {
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
            this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
              queryParams: { inspeccionId: nuevaInsp.id }
            });
          },
          error: (err) => {
            console.warn('No se pudo crear en servidor, abriendo modo offline:', err);
            this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva']);
          }
        });
    } else {
      // Modo Offline directo
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva']);
    }
  }

  /**
   * Fuerza el envío de todas las inspecciones offline pendientes si hay conexión (US 05).
   */
  forzarSincronizacion(): void {
    if (this.networkStatus.online() && this.syncService.pendingCount() > 0) {
      this.syncService.syncAllPending();
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
