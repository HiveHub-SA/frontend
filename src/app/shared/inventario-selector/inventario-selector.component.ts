import { Component, Input, OnChanges, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioService } from '../../inventario/inventario.service';
import { InventarioResponseDTO, TipoInventarioNombre, TIPO_INVENTARIO_LABELS } from '../../inventario/inventario.model';

interface GrupoAlzas {
    marcos: number;
    items: InventarioResponseDTO[];
}

@Component({
    selector: 'app-inventario-selector',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './inventario-selector.component.html',
    styleUrl: './inventario-selector.component.css',
})
export class InventarioSelectorComponent implements OnChanges {
    @Input({ required: true }) tipo!: TipoInventarioNombre;
    @Input() seleccionados: number[] = [];
    @Input() preAsignados: InventarioResponseDTO[] = [];
    @Input() max: number | null = null;
    @Output() seleccionadosChange = new EventEmitter<number[]>();

    disponibles: InventarioResponseDTO[] = [];
    loading = false;

    get labelTipo(): string {
        return TIPO_INVENTARIO_LABELS[this.tipo];
    }

    get esAlza(): boolean {
        return this.tipo === 'ALZA';
    }

    get todosVisibles(): InventarioResponseDTO[] {
        return [...this.preAsignados, ...this.disponibles]
            .filter((i, idx, arr) => arr.findIndex((x) => x.id === i.id) === idx)
            .sort((a, b) => a.id - b.id);
    }

    get gruposAlzas(): GrupoAlzas[] {
        const grupos = new Map<number, InventarioResponseDTO[]>();
        for (const inv of this.todosVisibles) {
            const m = inv.cantidadMarcos ?? 0;
            if (!grupos.has(m)) grupos.set(m, []);
            grupos.get(m)!.push(inv);
        }
        return Array.from(grupos.entries())
            .sort(([a], [b]) => a - b)
            .map(([marcos, items]) => ({ marcos, items }));
    }

    constructor(private inventarioService: InventarioService) { }

    ngOnChanges(changes: SimpleChanges): void {
        // Solo re-fetchar cuando cambia el tipo, no cuando cambia seleccionados o preAsignados
        if (changes['tipo']) {
            this.loading = true;
            this.inventarioService.listarDisponibles(this.tipo).subscribe({
                next: (data) => { this.disponibles = data; this.loading = false; },
                error: () => { this.loading = false; },
            });
        }
    }

    isSelected(id: number): boolean {
        return this.seleccionados.includes(id);
    }

    isMaxedOut(): boolean {
        return this.max != null && this.seleccionados.length >= this.max;
    }

    puedeSeleccionar(id: number): boolean {
        return this.isSelected(id) || !this.isMaxedOut();
    }

    toggle(id: number): void {
        if (!this.puedeSeleccionar(id)) return;
        const nuevos = this.isSelected(id)
            ? this.seleccionados.filter((x) => x !== id)
            : [...this.seleccionados, id];
        this.seleccionadosChange.emit(nuevos);
    }
}