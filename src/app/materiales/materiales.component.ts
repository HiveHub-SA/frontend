import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioService } from '../inventario/inventario.service';
import { InventarioResponseDTO, TipoInventarioNombre, TIPO_INVENTARIO_LABELS } from '../inventario/inventario.model';
import { RegistrarMaterialComponent } from '../inventario/registrar-material/registrar-material.component';

interface GrupoMaterial {
    tipo: TipoInventarioNombre;
    label: string;
    items: InventarioResponseDTO[];
}

@Component({
    selector: 'app-materiales',
    standalone: true,
    imports: [CommonModule, RegistrarMaterialComponent],
    templateUrl: './materiales.component.html',
    styleUrl: './materiales.component.css',
})
export class MaterialesComponent implements OnInit {

    // --- Signals ---
    private todosLosItems = signal<InventarioResponseDTO[]>([]);
    filtroDisponible = signal<boolean | null>(null);
    loading = signal(false);
    mostrarFormulario = signal(false);

    // --- Computed: se recalcula solo cuando cambia todosLosItems o filtroDisponible ---
    gruposFiltrados = computed<GrupoMaterial[]>(() => {
        const filtro = this.filtroDisponible();
        const items = filtro === null
            ? this.todosLosItems()
            : this.todosLosItems().filter((i) =>
                filtro ? i.colmenaId === null : i.colmenaId !== null
            );

        const orden: TipoInventarioNombre[] = ['CAMARA', 'ALZA', 'NUCLEO'];
        return orden.map((tipo) => ({
            tipo,
            label: TIPO_INVENTARIO_LABELS[tipo],
            items: items.filter((i) => i.tipoNombre === tipo),
        }));
    });

    constructor(private inventarioService: InventarioService) { }

    ngOnInit(): void {
        this.cargar();
    }

    cargar(): void {
        this.loading.set(true);
        this.inventarioService.listarTodos().subscribe({
            next: (data) => {
                this.todosLosItems.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    setFiltro(valor: boolean | null): void {
        this.filtroDisponible.set(valor);
    }

    onRegistrado(): void {
        this.mostrarFormulario.set(false);
        this.cargar();
    }
}