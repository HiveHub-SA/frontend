import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarService } from '../navbar/navbar.service';
import { NetworkStatusService } from '../shared/services/network-status.service';
import { InspeccionSyncService } from '../inspecciones/services/inspeccion-sync.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  public networkStatus = inject(NetworkStatusService);
  public navbarService = inject(NavbarService);
  public syncService = inject(InspeccionSyncService);

  forzarSincronizacion(): void {
    if (this.networkStatus.online() && this.syncService.pendingCount() > 0) {
      this.syncService.syncAllPending();
    }
  }
}
