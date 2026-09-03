import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InspeccionService } from '../inspeccion.service';
import { ApiarioService } from '../../apiarios/apiario.service';
import { InspeccionDTO, InspeccionColmenaDTO } from '../inspeccion.model';
import { NavbarComponent } from '../../navbar/navbar.component';

/**
 * Componente para la pantalla de Detalle de Inspección Registrada (Finalizada).
 * Muestra el resumen de la inspección sincronizada (fecha, floración, colmenas revisadas)
 * y el detalle sanitarios y operativo por cada colmena del apiario.
 */
@Component({
  selector: 'app-detalle-inspeccion',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './detalle-inspeccion.html',
  styleUrl: './detalle-inspeccion.css',
})
export class DetalleInspeccionComponent implements OnInit {
  apiarioId!: number;
  inspeccionId!: number;

  nombreApiario = signal<string>('Apiario');
  inspeccion = signal<InspeccionDTO | null>(null);
  colmenasDetalle = signal<InspeccionColmenaDTO[]>([]);
  totalColmenasApiario = signal<number>(0);
  loading = signal<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiarioService: ApiarioService,
    private inspeccionService: InspeccionService
  ) { }

  ngOnInit(): void {
    this.apiarioId = Number(this.route.snapshot.params['apiarioId']);
    this.inspeccionId = Number(this.route.snapshot.params['inspeccionId']);

    if (this.apiarioId) {
      this.cargarApiario();
    }

    if (this.inspeccionId) {
      this.cargarInspeccion();
    }
  }

  cargarApiario(): void {
    this.apiarioService.getApiarioById(this.apiarioId).subscribe({
      next: (data) => {
        if (data && data.name) this.nombreApiario.set(data.name);
        if (data && data.colmenas) {
          this.totalColmenasApiario.set(data.colmenas.length);
        }
      },
      error: (err) => console.error('Error al cargar apiario:', err)
    });
  }

  cargarInspeccion(): void {
    this.loading.set(true);
    this.inspeccionService.getInspeccionById(this.inspeccionId).subscribe({
      next: (insp) => {
        this.inspeccion.set(insp);
        this.cargarColmenasDetalle();
      },
      error: (err) => {
        console.error('Error al cargar inspección:', err);
        this.loading.set(false);
      }
    });
  }

  cargarColmenasDetalle(): void {
    this.inspeccionService.getInspeccionesColmenas(this.inspeccionId).subscribe({
      next: (detalles) => {
        this.colmenasDetalle.set(detalles);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar detalles de colmenas:', err);
        this.loading.set(false);
      }
    });
  }

  formatFecha(fechaIso?: string): string {
    if (!fechaIso) return '';
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

  getLabelVarroa(val?: string): { text: string; class: string } {
    if (val === 'DETECTADA') {
      return { text: '⚠️ Varroa: Detectada', class: 'badge-error' };
    }
    return { text: 'Varroa: OK', class: 'badge-success' };
  }

  getLabelReina(val?: string): { text: string; class: string } {
    switch (val) {
      case 'VISTA_Y_SANA':
        return { text: '👑 Reina: Vista', class: 'badge-info' };
      case 'NO_VISTA':
        return { text: '🔍 Reina: No vista', class: 'badge-muted' };
      case 'CELDA_REAL':
        return { text: '🥚 Celda Real', class: 'badge-warning' };
      case 'AUSENTE':
        return { text: '❌ Reina: Ausente', class: 'badge-error' };
      default:
        return { text: 'Reina: N/I', class: 'badge-muted' };
    }
  }

  getLabelAlimento(val?: string): { text: string; class: string } {
    switch (val) {
      case 'BAJO':
        return { text: 'Alimento: Bajo', class: 'badge-warning' };
      case 'MEDIO':
        return { text: 'Alimento: Medio', class: 'badge-warning' };
      case 'ALTO':
        return { text: 'Alimento: Alto', class: 'badge-primary' };
      default:
        return { text: 'Alimento: N/I', class: 'badge-muted' };
    }
  }

  getLabelMiel(val?: boolean): { text: string; class: string } {
    if (val === true) {
      return { text: '🍯 Miel: Lista', class: 'badge-primary' };
    }
    return { text: 'No produjo miel', class: 'badge-muted' };
  }
}
