import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiarioDTO } from '../apiario.model';
import { ApiarioService } from '../apiario.service';
import { FormsModule } from '@angular/forms';
import { ConfirmDeleteComponent } from '../../confirm-delete-component/confirm-delete-component';
import { InventarioService } from '../../inventario/inventario.service';
import { forkJoin, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-detalle-apiario',
  imports: [CommonModule, RouterLink, FormsModule, ConfirmDeleteComponent],
  templateUrl: './detalle-apiario.html',
  styleUrl: './detalle-apiario.css',
})
export class ApiarioDetailComponent implements OnInit {
  apiario = signal<ApiarioDTO | null>(null);
  loading = signal<boolean>(true);
  apiarioId!: number | null;

  totalCamaras = computed(() => this.apiario()?.colmenas.reduce((sum, c) => sum + (c.camaras || 0), 0) || 0);
  totalAlzas = computed(() => this.apiario()?.colmenas.reduce((sum, c) => sum + (c.alzas || 0), 0) || 0);
  totalNucleos = computed(() => this.apiario()?.colmenas.reduce((sum, c) => sum + (c.nucleos || 0), 0) || 0);

  camarasLabel = computed(() => (this.totalCamaras() === 1 ? 'Colmena' : 'Colmenas'));
  alzasLabel = computed(() => (this.totalAlzas() === 1 ? 'Alza' : 'Alzas'));
  nucleosLabel = computed(() => (this.totalNucleos() === 1 ? 'Núcleo' : 'Núcleos'));

  showDeleteModal = signal<boolean>(false);
  deleting = signal<boolean>(false);
  deleteError = signal<string | null>(null);

  creating = signal<boolean>(false);
  createError = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private apiarioService: ApiarioService,
    private inventarioService: InventarioService,
    private http: HttpClient,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.apiarioId = this.route.snapshot.params['id'];
    if (this.apiarioId) {
      this.apiarioService.getApiarioById(this.apiarioId).subscribe({
        next: (data) => { this.apiario.set(data); this.loading.set(false); },
        error: (error) => { console.error(error); this.loading.set(false); },
      });
    }
  }

  showForm = false;

  newColmena = { name: '', apiarioId: 0 };

  // Material a registrar al crear la colmena
  materialInicio = {
    camaras: 0,   // 0-2
    alzas: 0,     // 0-5
    marcosAlza: null as number | null,
    nucleos: 0,   // sin restricción
  };

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.cleanForm();
  }

  cleanForm() {
    this.newColmena = { name: '', apiarioId: 0 };
    this.materialInicio = { camaras: 0, alzas: 0, marcosAlza: null, nucleos: 0 };
    this.createError.set(null);
  }

  // Limpiar marcos si se bajan las alzas a 0
  decrementAlzas() {
    if (this.materialInicio.alzas > 0) {
      this.materialInicio.alzas--;
      if (this.materialInicio.alzas === 0) {
        this.materialInicio.marcosAlza = null;
      }
    }
  }

  createColmena() {
    if (!this.apiarioId) return;

    // Validación cliente (espejo de las reglas del backend)
    if (this.materialInicio.alzas > 0 && !this.materialInicio.marcosAlza) {
      this.createError.set('Debés especificar los marcos de las alzas (8, 9 o 10).');
      return;
    }

    this.creating.set(true);
    this.createError.set(null);
    this.newColmena.apiarioId = this.apiarioId;

    this.http.post<any>('http://localhost:8080/hivehub/colmenas', this.newColmena).pipe(
      switchMap(colmena => {
        const requests = [];

        for (let i = 0; i < this.materialInicio.camaras; i++) {
          requests.push(this.inventarioService.registrarInventario({
            tipoInventario: 'Colmena',
            colmenaId: colmena.id,
          }));
        }
        for (let i = 0; i < this.materialInicio.alzas; i++) {
          requests.push(this.inventarioService.registrarInventario({
            tipoInventario: 'Alza',
            cantidadMarcos: this.materialInicio.marcosAlza,
            colmenaId: colmena.id,
          }));
        }
        for (let i = 0; i < this.materialInicio.nucleos; i++) {
          requests.push(this.inventarioService.registrarInventario({
            tipoInventario: 'Núcleo',
            colmenaId: colmena.id,
          }));
        }

        return requests.length > 0 ? forkJoin(requests) : of([]);
      })
    ).subscribe({
      next: () => {
        this.creating.set(false);
        this.showForm = false;
        this.cleanForm();
        if (this.apiarioId) {
          this.apiarioService.getApiarioById(this.apiarioId).subscribe({
            next: (data) => this.apiario.set(data),
            error: (err) => console.error('Error al refrescar apiario:', err),
          });
        }
      },
      error: (err) => {
        console.error('Error al crear colmena:', err);
        this.creating.set(false);
        const msg = typeof err?.error === 'string'
          ? err.error
          : 'Ocurrió un error al crear la colmena.';
        this.createError.set(msg);
      }
    });
  }

  trackByColmenaId(index: number, colmena: any): number {
    return colmena?.id ?? index;
  }

  openDeleteModal() { this.deleteError.set(null); this.showDeleteModal.set(true); }
  closeDeleteModal() { this.showDeleteModal.set(false); }

  confirmDelete() {
    if (!this.apiarioId) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    this.apiarioService.deleteApiario(this.apiarioId).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.router.navigate(['/apiarios']);
      },
      error: (error) => {
        console.error(error);
        this.deleting.set(false);
        this.deleteError.set('No se pudo eliminar el apiario. Intente nuevamente');
      },
    });
  }
}