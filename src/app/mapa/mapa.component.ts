import { Component } from '@angular/core';

@Component({
  selector: 'app-mapa',
  standalone: true,
  template: `
    <div class="content-container">
      <section class="placeholder-section">
        <h2 class="section-title">Mapa de Colmenas</h2>
        <div class="placeholder-card">
          <span class="material-symbols-outlined placeholder-icon">map</span>
          <p class="placeholder-text">Sección del Mapa en desarrollo.</p>
          <p class="placeholder-subtext">Aquí se visualizarán las ubicaciones geográficas de todos los apiarios registrados.</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .content-container {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-bottom: 96px;
    }
    .placeholder-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .section-title {
      font-family: var(--font-headline);
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-on-surface-variant);
      margin: 0;
    }
    .placeholder-card {
      background-color: var(--color-surface-container-lowest);
      border: var(--border-dark);
      border-radius: 8px;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-shadow: var(--shadow-hard);
    }
    .placeholder-icon {
      font-size: 64px;
      color: var(--color-primary);
      margin-bottom: 16px;
    }
    .placeholder-text {
      font-family: var(--font-headline);
      font-size: 18px;
      font-weight: 900;
      color: var(--color-on-surface);
      margin: 0 0 8px 0;
    }
    .placeholder-subtext {
      font-family: var(--font-body);
      font-size: 14px;
      color: var(--color-on-surface-variant);
      max-width: 300px;
      margin: 0;
    }
  `]
})
export class MapaComponent {}
