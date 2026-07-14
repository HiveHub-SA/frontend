import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiarioService } from '../apiario.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-apiario-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './list-aparios.html',
  styleUrl: './list-apiarios.css',
})
export class ApiarioListComponent {
  private apiarioService = inject(ApiarioService);
  misApiarios = toSignal(this.apiarioService.getAll(), { initialValue: [] });
}
