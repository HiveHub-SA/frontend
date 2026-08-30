import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Componente utilitario sin UI que ejecuta el logout al ser cargado.
 * Se accede navegando a /api/auth/logouttest.
 * TEMPORAL: será reemplazado por el botón de logout en header
 * cuando el equipo lo decida.
 */
@Component({
  selector: 'app-logout',
  standalone: true,
  template: ''
})
export class LogoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
