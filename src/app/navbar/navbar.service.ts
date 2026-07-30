import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {
  readonly isDisabled = signal<boolean>(false);

  setDisabled(disabled: boolean): void {
    (this.isDisabled as any).set(disabled);
  }
}
