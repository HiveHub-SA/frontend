import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../inventario.service';
import { InventarioRequestDTO, TipoInventarioNombre, MARCOS_VALIDOS } from '../inventario.model';

@Component({
    selector: 'app-registrar-material',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './registrar-material.component.html',
    styleUrl: './registrar-material.component.css',
})
export class RegistrarMaterialComponent {
    @Output() registrado = new EventEmitter<void>();
    @Output() cerrado = new EventEmitter<void>();

    registrando = false;
    error: string | null = null;
    marcosValidos = MARCOS_VALIDOS;

    material: InventarioRequestDTO = { tipoInventario: 'CAMARA', cantidadMarcos: null, pesoInventario: null };

    constructor(private inventarioService: InventarioService) { }

    onTipoChange() {
        if (this.material.tipoInventario !== 'ALZA') {
            this.material.cantidadMarcos = null;
        }
    }

    registrar() {
        if (this.material.tipoInventario === 'ALZA' && !this.marcosValidos.includes(this.material.cantidadMarcos as any)) {
            this.error = 'El Alza debe tener 8, 9 o 10 marcos.';
            return;
        }

        this.registrando = true;
        this.error = null;

        this.inventarioService.registrarInventario(this.material).subscribe({
            next: () => {
                this.registrando = false;
                this.material = { tipoInventario: 'CAMARA', cantidadMarcos: null, pesoInventario: null };
                this.registrado.emit();
            },
            error: (err) => {
                this.registrando = false;
                this.error = typeof err?.error === 'string' ? err.error : 'No se pudo registrar el material.';
            },
        });
    }

    cerrar() {
        this.cerrado.emit();
    }
}