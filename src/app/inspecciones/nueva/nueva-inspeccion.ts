import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiarioService } from '../../apiarios/apiario.service';
import { ApiarioDTO } from '../../apiarios/apiario.model';
import { InspeccionService } from '../inspeccion.service';
import { ColmenaEstadoInspeccion, OPCIONES_FLORACION, TipoFloracion } from '../inspeccion.model';
import { NavbarComponent } from '../../navbar/navbar.component';

import { InspeccionDraftService } from '../inspeccion-draft.service';

/**
 * Componente para la pantalla de Nueva Inspección.
 * Permite visualizar la fecha actual, precargar o modificar la Floración Predominante del apiario,
 * visualizar la lista de colmenas con sus estados ("✓ Inspección guardada" vs "Pendiente de revisión")
 * y finalizar la inspección.
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

  /** Presencia/Nivel de Varroa del apiario (US 43) */
  varroaActual = signal<'NO_DETECTADA' | 'DETECTADA'>('NO_DETECTADA');

  /** Controla la visibilidad del modal/desplegable para cambiar el tipo de floración */
  mostrarSelectorFloracion = signal<boolean>(false);

  /** Opciones de floración disponibles (Girasol, Eucalipto, Trébol, Alfalfa, Citrus, Monte Nativo, Multifloral) */
  opcionesFloracion = OPCIONES_FLORACION;

  /** Lista de colmenas con sus estados de inspección */
  colmenasEstado = signal<ColmenaEstadoInspeccion[]>([]);

  /** Estado de carga de la pantalla */
  loading = signal<boolean>(true);

  /** Evita envíos duplicados por clics múltiples (APB) */
  isSubmitting = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiarioService: ApiarioService,
    private inspeccionService: InspeccionService,
    private draftService: InspeccionDraftService
  ) { }

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
      // US 15.1: Verificar borrador local previo tras crash o recarga
      const localDraft = this.draftService.getDraft(this.apiarioId);
      if (localDraft) {
        if (localDraft.inspeccionId) this.inspeccionId = localDraft.inspeccionId;
        if (localDraft.floracion) {
          this.floracionActual.set(localDraft.floracion);
          this.floracionOriginal = localDraft.floracion;
        }
        if (localDraft.varroa) {
          this.varroaActual.set(localDraft.varroa);
        }
      }
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
        this.loading.set(false);
      }
    });

    // Si viene inspeccionId, obtener sus datos específicos; de lo contrario buscar el último borrador u última floración
    if (this.inspeccionId) {
      this.inspeccionService.getInspeccionById(this.inspeccionId).subscribe({
        next: (insp) => {
          if (insp) {
            if (insp.floracion) {
              this.floracionActual.set(insp.floracion);
              this.floracionOriginal = insp.floracion;
            }
            if (insp.varroa) {
              this.varroaActual.set(insp.varroa as 'NO_DETECTADA' | 'DETECTADA');
            }
            this.draftService.saveDraft(this.apiarioId, {
              inspeccionId: insp.id,
              floracion: insp.floracion,
              varroa: insp.varroa as 'NO_DETECTADA' | 'DETECTADA'
            });
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
            if (borrador.varroa) {
              this.varroaActual.set(borrador.varroa as 'NO_DETECTADA' | 'DETECTADA');
            }
            this.draftService.saveDraft(this.apiarioId, {
              inspeccionId: borrador.id,
              floracion: borrador.floracion,
              varroa: borrador.varroa as 'NO_DETECTADA' | 'DETECTADA'
            });
          } else {
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
   * Prepara la lista de colmenas asignándoles su estado de revisión según la inspección en curso.
   */
  prepararColmenas(apiario: ApiarioDTO): void {
    const colmenas = apiario.colmenas || [];
    const localDraft = this.draftService.getDraft(this.apiarioId);
    const colmenasGuardadasLocal = localDraft?.colmenasGuardadas || {};

    if (this.inspeccionId) {
      this.inspeccionService.getInspeccionesColmenas(this.inspeccionId).subscribe({
        next: (guardadas) => {
          const idsGuardadas = new Set(guardadas.map((g) => g.colmenaId));
          // Incluir también las guardadas en local draft (US 15.1)
          Object.keys(colmenasGuardadasLocal).forEach((cId) => idsGuardadas.add(Number(cId)));

          const estados: ColmenaEstadoInspeccion[] = colmenas.map((c, index) => {
            const id = (c['id'] as number) || index + 1;
            const name = (c['name'] as string) || `Colmena #${String(index + 1).padStart(2, '0')}`;
            const completada = idsGuardadas.has(id);
            return {
              id,
              name,
              completada,
              estadoTexto: completada ? '✓ Inspección guardada' : 'Pendiente de revisión'
            };
          });
          this.colmenasEstado.set(estados);
        },
        error: () => this.fallbackPrepararColmenas(colmenas)
      });
    } else {
      this.fallbackPrepararColmenas(colmenas);
    }
  }

  fallbackPrepararColmenas(colmenas: any[]): void {
    const localDraft = this.draftService.getDraft(this.apiarioId);
    const colmenasGuardadasLocal = localDraft?.colmenasGuardadas || {};

    const estados: ColmenaEstadoInspeccion[] = colmenas.map((c, index) => {
      const id = (c['id'] as number) || index + 1;
      const name = (c['name'] as string) || `Colmena #${String(index + 1).padStart(2, '0')}`;
      const completada = !!colmenasGuardadasLocal[id];
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

    // US 15: Guardado continuo local
    this.draftService.saveDraft(this.apiarioId, { floracion: opcion });

    if (this.inspeccionId) {
      this.inspeccionService.updateFloracion(this.inspeccionId, opcion).subscribe({
        next: () => console.log('Floración actualizada en el borrador:', opcion),
        error: (err) => console.error('Error al actualizar floración:', err)
      });
    }
  }

  /**
   * Selecciona el nivel de infestación de Varroa a nivel de apiario (US 43).
   */
  seleccionarVarroa(opcion: 'NO_DETECTADA' | 'DETECTADA'): void {
    this.varroaActual.set(opcion);

    // US 15 / 43: Guardado continuo local
    this.draftService.saveDraft(this.apiarioId, { varroa: opcion });

    if (this.inspeccionId) {
      this.inspeccionService.updateVarroa(this.inspeccionId, opcion).subscribe({
        next: () => console.log('Varroa actualizada en el borrador:', opcion),
        error: (err) => console.error('Error al actualizar varroa:', err)
      });
    }
  }

  /**
   * Manejador al seleccionar una tarjeta de colmena para inspeccionarla (US 32).
   */
  seleccionarColmena(colmena: ColmenaEstadoInspeccion): void {
    if (this.inspeccionId) {
      this.router.navigate([
        '/apiarios', this.apiarioId,
        'inspecciones', this.inspeccionId,
        'colmenas', colmena.id
      ]);
    } else {
      this.inspeccionService
        .createInspeccion(this.apiarioId, {
          fecha: new Date().toISOString(),
          floracion: this.floracionActual(),
          varroa: this.varroaActual(),
          estado: 'EN_BORRADOR',
          apiarioId: this.apiarioId
        })
        .subscribe({
          next: (borrador) => {
            this.inspeccionId = borrador.id || null;
            this.draftService.saveDraft(this.apiarioId, {
              inspeccionId: borrador.id,
              floracion: this.floracionActual(),
              varroa: this.varroaActual()
            });
            this.router.navigate([
              '/apiarios', this.apiarioId,
              'inspecciones', borrador.id,
              'colmenas', colmena.id
            ]);
          },
          error: (err) => {
            console.error('Error al crear borrador para colmena:', err);
          }
        });
    }
  }

  /**
   * Finaliza la inspección cambiando el estado del borrador a "SINCRONIZADA".
   */
  finalizarInspeccion(): void {
    const onFinalizedSuccess = () => {
      // US 15 / 15.1: Purga limpia del borrador local
      this.draftService.clearDraft(this.apiarioId);
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones']);
    };

    if (this.inspeccionId) {
      this.inspeccionService.finalizarInspeccion(this.inspeccionId).subscribe({
        next: onFinalizedSuccess,
        error: (err) => {
          console.error('Error al finalizar inspección:', err);
          onFinalizedSuccess();
        }
      });
    } else {
      this.inspeccionService
        .createInspeccion(this.apiarioId, {
          fecha: new Date().toISOString(),
          floracion: this.floracionActual(),
          varroa: this.varroaActual(),
          estado: 'SINCRONIZADA',
          apiarioId: this.apiarioId
        })
        .subscribe({
          next: onFinalizedSuccess,
          error: (err) => {
            console.error('Error al crear y finalizar inspección:', err);
            onFinalizedSuccess();
          }
        });
    }
  }
}
