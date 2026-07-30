import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarService } from '../navbar/navbar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  protected readonly navbarService = inject(NavbarService);
}
