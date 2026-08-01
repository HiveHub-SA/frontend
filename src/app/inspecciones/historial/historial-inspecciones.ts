import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InspeccionDTO } from '../inspeccion.model';
import { InspeccionService } from '../inspeccion.service';
import { ApiarioService } from '../../apiarios/apiario.service';
import { ApiarioDTO } from '../../apiarios/apiario.model';
import { NavbarComponent } from '../../navbar/navbar.component';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiarioService: ApiarioService,
    private inspeccionService: InspeccionService
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
   * Si la inspección está EN BORRADOR, navega a la pantalla de edición para retomar el progreso.
   */
  verInspeccion(inspeccion: InspeccionDTO): void {
    if (inspeccion.estado === 'EN_BORRADOR' && inspeccion.id) {
      // Retomar la inspección en borrador existente
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
        queryParams: { inspeccionId: inspeccion.id }
      });
    } else {
      console.log('Visualizar detalle de inspección sincronizada:', inspeccion);
    }
  }

  /**
   * Redirige a la pantalla de Nueva Inspección.
   * Si ya existe un borrador pendiente en el apiario, retoma dicho borrador;
   * de lo contrario, crea un borrador nuevo y navega hacia él.
   */
  crearNuevaInspeccion(): void {
    const borradorExistente = this.inspecciones().find((i) => i.estado === 'EN_BORRADOR');

    if (borradorExistente && borradorExistente.id) {
      // Retomar borrador activo existente
      this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
        queryParams: { inspeccionId: borradorExistente.id }
      });
    } else {
      // Obtener la floración del registro más reciente si existe
      const inspeccionesExistentes = this.inspecciones();
      const ultimaFloracion = inspeccionesExistentes.length > 0 && inspeccionesExistentes[0].floracion
        ? inspeccionesExistentes[0].floracion
        : 'Girasol';

      // Crear un nuevo borrador de inspección con la floración previa
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
}
