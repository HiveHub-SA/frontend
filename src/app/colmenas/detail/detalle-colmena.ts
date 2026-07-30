import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColmenaService } from '../colmena.service';
import { ColmenaDTO, ColmenaRequestDTO } from '../colmena.model';
import { calcularComposicion, formatearAlzas } from '../colmena-composicion.util';
import { ConfirmDeleteComponent } from '../../confirm-delete-component/confirm-delete-component';
import { InventarioSelectorComponent } from '../../shared/inventario-selector/inventario-selector.component';

@Component({
  selector: 'app-detalle-colmena',
  imports: [CommonModule, RouterLink, ConfirmDeleteComponent, FormsModule, InventarioSelectorComponent],
  templateUrl: './detalle-colmena.html',
  styleUrl: './detalle-colmena.css',
})
export class ColmenaDetailComponent implements OnInit {
  colmena = signal<ColmenaDTO | null>(null);
  loading = signal<boolean>(true);
  colmenaId!: number | null;

  showDeleteModal = signal<boolean>(false);
  deleting = signal<boolean>(false);
  deleteError = signal<string | null>(null);

  editMode = signal<boolean>(false);
  saving = signal<boolean>(false);
  saveError = signal<string | null>(null);

  // Selección de inventario en modo edición
  idsCamaras: number[] = [];
  idsAlzas: number[] = [];
  idsNucleos: number[] = [];
  nombreEdit = '';

  composicion = computed(() => calcularComposicion(this.colmena()?.inventarios ?? []));
  alzasTexto = computed(() => formatearAlzas(this.composicion()));

  camarasActuales = computed(() =>
    this.colmena()?.inventarios.filter((i) => i.tipoNombre === 'CAMARA') ?? []
  );
  alzasActuales = computed(() =>
    this.colmena()?.inventarios.filter((i) => i.tipoNombre === 'ALZA') ?? []
  );
  nucleosActuales = computed(() =>
    this.colmena()?.inventarios.filter((i) => i.tipoNombre === 'NUCLEO') ?? []
  );

  constructor(
    private route: ActivatedRoute,
    private colmenaService: ColmenaService,
    private router: Router
  ) { }

  ngOnInit() {
    this.colmenaId = this.route.snapshot.params['id'];
    if (this.colmenaId) {
      this.cargarColmena();
    }
  }

  private cargarColmena() {
    this.colmenaService.getColmenaById(this.colmenaId!).subscribe({
      next: (data) => { this.colmena.set(data); this.loading.set(false); },
      error: (error) => { console.error('Error al traer los datos de la colmena:', error); this.loading.set(false); },
    });
  }

  toggleEditMode() {
    this.editMode.update((v) => !v);
    this.saveError.set(null);
    if (this.editMode() && this.colmena()) {
      const inv = this.colmena()!.inventarios;
      this.nombreEdit = this.colmena()!.name;
      this.idsCamaras = inv.filter((i) => i.tipoNombre === 'CAMARA').map((i) => i.id);
      this.idsAlzas = inv.filter((i) => i.tipoNombre === 'ALZA').map((i) => i.id);
      this.idsNucleos = inv.filter((i) => i.tipoNombre === 'NUCLEO').map((i) => i.id);
    }
  }

  guardarColmena() {
    if (!this.colmenaId || !this.colmena()) return;
    this.saving.set(true);
    this.saveError.set(null);

    const request: ColmenaRequestDTO = {
      name: this.nombreEdit,
      apiarioId: this.colmena()!.apiarioId,
      inventarioIds: [...this.idsCamaras, ...this.idsAlzas, ...this.idsNucleos],
    };

    this.colmenaService.updateColmena(this.colmenaId, request).subscribe({
      next: (updated) => {
        this.colmena.set(updated);
        this.saving.set(false);
        this.editMode.set(false);
      },
      error: (err) => {
        console.error('Error al guardar la colmena:', err);
        this.saving.set(false);
        this.saveError.set(typeof err?.error === 'string' ? err.error : 'No se pudo guardar la colmena.');
      },
    });
  }

  openDeleteModal() {
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
  }

  confirmDelete() {
    if (!this.colmenaId) return;
    this.deleting.set(true);
    this.deleteError.set(null);

    this.colmenaService.deleteColmena(this.colmenaId).subscribe({
      next: () => {
        const apiarioId = this.colmena()?.apiarioId;
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.router.navigate(['/apiarios/', apiarioId]);
      },
      error: (error) => {
        console.error('Error al eliminar la colmena:', error);
        this.deleting.set(false);
        this.deleteError.set('No se pudo eliminar la colmena. Intente nuevamente.');
      },
    });
  }
}