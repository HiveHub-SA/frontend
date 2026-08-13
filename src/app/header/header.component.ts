import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarService } from '../navbar/navbar.service';
import { NetworkStatusService } from '../shared/services/network-status.service';


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
}
