import { Component, input, output } from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-confirm-delete-component',
  imports: [CommonModule],
  templateUrl: './confirm-delete-component.html',
  styleUrl: './confirm-delete-component.css',
})
export class ConfirmDeleteComponent {
  visible = input.required<boolean>();
  title = input<string>('¿Eliminar elemento?');
  itemName = input<string>('');
  entityLabel = input<string>('elemento');
  loading = input<boolean>(false);
  errorMessage = input<string | null>(null);
  extraWarning = input<string | null>(null);

  confirmed = output<void>();
  cancelled = output<void>();

  onBackdropClick() {
    if (this.loading()) return;
    this.cancelled.emit();
  }

  onCancel() {
    if (this.loading()) return;
    this.cancelled.emit();
  }

  onConfirm() {
    this.confirmed.emit();
  }
}
