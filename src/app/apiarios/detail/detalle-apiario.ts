import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiarioDTO } from '../apiario.model';
import { ApiarioService } from '../apiario.service';
import { ConfirmDeleteComponent } from '../../confirm-delete-component/confirm-delete-component';
import { InventarioSelectorComponent } from '../../shared/inventario-selector/inventario-selector.component';
import { ColmenaService } from '../../colmenas/colmena.service';
import { ColmenaRequestDTO } from '../../colmenas/colmena.model';
import { calcularComposicion } from '../../colmenas/colmena-composicion.util';

@Component({
  selector: 'app-detalle-apiario',
  imports: [CommonModule, RouterLink, FormsModule, ConfirmDeleteComponent, InventarioSelectorComponent],
  templateUrl: './detalle-apiario.html',
  styleUrl: './detalle-apiario.css',
})
export class ApiarioDetailComponent implements OnInit {
  apiario = signal<ApiarioDTO | null>(null);
  loading = signal<boolean>(true);
  apiarioId!: number | null;

  private todosLosInventarios = computed(() =>
    this.apiario()?.colmenas.flatMap((c) => c.inventarios) ?? []
  );
  composicionTotal = computed(() => calcularComposicion(this.todosLosInventarios()));

  camarasLabel = computed(() => (this.composicionTotal().camaras === 1 ? 'Cámara' : 'Cámaras'));
  alzasLabel = computed(() => (this.composicionTotal().alzas === 1 ? 'Alza' : 'Alzas'));
  nucleosLabel = computed(() => (this.composicionTotal().nucleos === 1 ? 'Núcleo' : 'Núcleos'));

  showDeleteModal = signal<boolean>(false);
  deleting = signal<boolean>(false);
  deleteError = signal<string | null>(null);

  showForm = false;
  creating = signal<boolean>(false);
  createError = signal<string | null>(null);

  nombreNuevaColmena = '';
  idsCamaras: number[] = [];
  idsAlzas: number[] = [];
  idsNucleos: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiarioService: ApiarioService,
    private colmenaService: ColmenaService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.apiarioId = this.route.snapshot.params['id'];
    if (this.apiarioId) {
      this.cargarApiario();
    }
  }

  private cargarApiario() {
    this.apiarioService.getApiarioById(this.apiarioId!).subscribe({
      next: (data) => { this.apiario.set(data); this.loading.set(false); },
      error: (error) => { console.error(error); this.loading.set(false); },
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.limpiarForm();
  }

  limpiarForm() {
    this.nombreNuevaColmena = '';
    this.idsCamaras = [];
    this.idsAlzas = [];
    this.idsNucleos = [];
    this.createError.set(null);
  }

  crearColmena() {
    if (!this.apiarioId) return;

    this.creating.set(true);
    this.createError.set(null);

    const request: ColmenaRequestDTO = {
      name: this.nombreNuevaColmena,
      apiarioId: this.apiarioId,
      inventarioIds: [...this.idsCamaras, ...this.idsAlzas, ...this.idsNucleos],
    };

    this.colmenaService.crearColmena(request).subscribe({
      next: () => {
        this.creating.set(false);
        this.showForm = false;
        this.limpiarForm();
        this.cargarApiario();
      },
      error: (err) => {
        console.error('Error al crear colmena:', err);
        this.creating.set(false);
        this.createError.set(typeof err?.error === 'string' ? err.error : 'Ocurrió un error al crear la colmena.');
      },
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