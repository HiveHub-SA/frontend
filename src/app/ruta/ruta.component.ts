import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutaManagerService } from './ruta-manager.service';

@Component({
    selector: 'app-ruta-panel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ruta.component.html',
    styleUrl: './ruta.component.css',
})
export class RutaPanelComponent {

    @Input({ required: true })
    rutaManager!: RutaManagerService;

    @Output()
    calcular = new EventEmitter<void>();

    @Output()
    limpiar = new EventEmitter<void>();

}