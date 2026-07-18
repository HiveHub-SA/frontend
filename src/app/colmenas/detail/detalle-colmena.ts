import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ColmenaService } from '../colmena.service';
import { ColmenaDTO } from '../colmena.model'
import { CommonModule } from '@angular/common';
import { ConfirmDeleteComponent } from '../../confirm-delete-component/confirm-delete-component';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../inventario/inventario.service';
import { InventarioRequestDTO } from '../../inventario/inventario.model';

@Component({
  selector: 'app-detalle-colmena',
  imports: [CommonModule, RouterLink, ConfirmDeleteComponent, FormsModule],
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

  // --- Registro de material físico (Historia de Usuario 23) ---
  showMaterialForm = signal<boolean>(false);
  registeringMaterial = signal<boolean>(false);
  materialError = signal<string | null>(null);

  marcosAlzaEdit = signal<number | null>(null);

  nuevoMaterial: InventarioRequestDTO = {
    tipoInventario: 'Colmena',
    cantidadMarcos: null,
    pesoInventario: null,
  };

  constructor(
    private route: ActivatedRoute,
    private colmenaService: ColmenaService,
    private inventarioService: InventarioService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.colmenaId = this.route.snapshot.params['id'];

    if (this.colmenaId) {
      this.colmenaService.getColmenaById(this.colmenaId).subscribe({
        next: data => {
          this.colmena.set(data);
          this.loading.set(false);
        },
        error: error => {
          console.error("Error al traer los datos de la colmena:", error);
          this.loading.set(false);
        }
      })
    }
  }

  /**
   * Alterna el modo de edición de la colmena.
   * Si se activa, inicializa el estado temporal de marcos de alza según el valor guardado.
   */
  toggleEditMode() {
    this.editMode.update(v => !v);
    if (this.editMode() && this.colmena()) {
      this.marcosAlzaEdit.set(this.colmena()!.marcosAlza || null);
    }
  }

  /**
   * Guarda los cambios realizados en el modo de edición.
   * Valida si los marcos de alza deben enviarse o descartarse en función del conteo de alzas.
   */
  saveColmena() {
    if (!this.colmenaId || !this.colmena()) return;
    this.saving.set(true);

    const currentColmena = this.colmena()!;

    if (currentColmena.alzas && currentColmena.alzas > 0) {
      currentColmena.marcosAlza = this.marcosAlzaEdit() ?? undefined;
    } else {
      currentColmena.marcosAlza = undefined;
    }

    this.colmenaService.updateColmena(this.colmenaId, currentColmena).subscribe({
      next: (updated) => {
        this.colmena.set(updated);
        this.marcosAlzaEdit.set(updated.marcosAlza || null);
        this.saving.set(false);
        this.editMode.set(false);
      },
      error: (err) => {
        console.error('Error al guardar la colmena:', err);
        this.saving.set(false);
      }
    });
  }
  // --- Lógica de registro de material físico ---

  /**
   * Alterna la visibilidad del modal para registrar material (alzas, núcleos, etc.).
   * También resetea el formulario al cerrarse.
   */
  toggleMaterialForm() {
    this.showMaterialForm.update(v => !v);
    this.materialError.set(null);
    if (!this.showMaterialForm()) {
      this.resetMaterialForm();
    }
  }

  /**
   * Restablece el formulario de material a sus valores predeterminados (tipo 'Colmena').
   */
  resetMaterialForm() {
    this.nuevoMaterial = {
      tipoInventario: 'Colmena',
      cantidadMarcos: null,
      pesoInventario: null,
    };
  }

  /**
   * Se ejecuta cuando cambia el tipo de inventario en el formulario.
   * Resetea la cantidad de marcos si el tipo seleccionado no es 'Alza'.
   */
  onTipoChange() {
    if (this.nuevoMaterial.tipoInventario !== 'Alza') {
      this.nuevoMaterial.cantidadMarcos = null;
    }
  }

  /**
   * Envía la solicitud para registrar nuevo material físico asociado a la colmena actual.
   * Incluye validación local para asegurar cantidad correcta de marcos en caso de ser un Alza.
   */
  registrarMaterial() {
    if (!this.colmenaId) return;

    if (this.nuevoMaterial.tipoInventario === 'Alza') {
      const marcos = this.nuevoMaterial.cantidadMarcos;
      if (marcos !== 8 && marcos !== 9 && marcos !== 10) {
        this.materialError.set('El Alza debe tener 8, 9 o 10 marcos.');
        return;
      }
    }

    this.registeringMaterial.set(true);
    this.materialError.set(null);

    const request: InventarioRequestDTO = {
      ...this.nuevoMaterial,
      colmenaId: this.colmenaId,
    };

    this.inventarioService.registrarInventario(request).subscribe({
      next: () => {
        this.registeringMaterial.set(false);
        this.showMaterialForm.set(false);
        this.resetMaterialForm();
        this.colmenaService.getColmenaById(this.colmenaId!).subscribe({
          next: (data) => this.colmena.set(data),
          error: (err) => console.error('Error al refrescar la colmena:', err),
        });
      },
      error: (err) => {
        console.error('Error al registrar material:', err);
        this.registeringMaterial.set(false);
        const mensaje = typeof err?.error === 'string'
          ? err.error
          : 'No se pudo registrar el material. Intente nuevamente.';
        this.materialError.set(mensaje);
      }
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
      error: error => {
        console.error('Error al eliminar la colmena:', error);
        this.deleting.set(false);
        this.deleteError.set('No se pudo eliminar la colmena. Intente nuevamente.');
      }
    });
  }

  /**
   * Reduce el conteo de alzas durante la edición y resetea los marcos
   * si el número de alzas llega a 0.
   * @param colmena Datos actuales de la colmena en el modal.
   */
  decrementAlzasEdit(colmena: any) {
    if (colmena.alzas > 0) {
      colmena.alzas--;
      if (colmena.alzas === 0) {
        this.marcosAlzaEdit.set(null);
      }
    }
  }
}