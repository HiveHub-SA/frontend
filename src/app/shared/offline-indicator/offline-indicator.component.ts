import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkStatusService } from '../services/network-status.service';

@Component({
    selector: 'app-offline-indicator',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './offline-indicator.html',
    styleUrl: './offline-indicator.css'
})
export class OfflineIndicatorComponent {

    readonly network = inject(NetworkStatusService);

}