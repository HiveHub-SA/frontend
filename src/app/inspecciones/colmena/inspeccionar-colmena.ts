import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InspeccionService } from '../inspeccion.service';
import { ApiarioService } from '../../apiarios/apiario.service';
import { InspeccionColmenaDTO } from '../inspeccion.model';
import { NavbarComponent } from '../../navbar/navbar.component';

/**
 * Componente para la pantalla de Inspección Manual por Colmena (US 32).
 * Muestra el formulario táctil con los campos de Varroa, Reina, Alimento, Miel,
 * Observaciones y módulo visual de nota de voz/transcripción.
 */
@Component({
  selector: 'app-inspeccionar-colmena',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  templateUrl: './inspeccionar-colmena.html',
  styleUrl: './inspeccionar-colmena.css',
})
export class InspeccionarColmenaComponent implements OnInit {
  apiarioId!: number;
  inspeccionId!: number;
  colmenaId!: number;

  nombreApiario = signal<string>('Apiario');
  nombreColmena = signal<string>('Colmena');
  loading = signal<boolean>(true);

  // Form Model
  varroa = signal<'NO_DETECTADA' | 'DETECTADA'>('NO_DETECTADA');
  estadoReina = signal<'VISTA_Y_SANA' | 'NO_VISTA' | 'CELDA_REAL' | 'AUSENTE'>('VISTA_Y_SANA');
  nivelAlimento = signal<'BAJO' | 'MEDIO' | 'ALTO'>('MEDIO');
  produjoMiel = signal<boolean>(true);
  observaciones: string = '';

  // UI state for audio transcription preview
  mostrarTranscripcion = signal<boolean>(false);
  isPlayingAudio = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiarioService: ApiarioService,
    private inspeccionService: InspeccionService
  ) {}

  ngOnInit(): void {
    this.apiarioId = Number(this.route.snapshot.params['apiarioId']);
    this.inspeccionId = Number(this.route.snapshot.params['inspeccionId']);
    this.colmenaId = Number(this.route.snapshot.params['colmenaId']);

    if (this.apiarioId) {
      this.apiarioService.getApiarioById(this.apiarioId).subscribe({
        next: (data) => {
          if (data && data.name) this.nombreApiario.set(data.name);
          const colmenaEncontrada = data.colmenas?.find((c: any) => (c['id'] as number) === this.colmenaId);
          if (colmenaEncontrada && colmenaEncontrada['name']) {
            this.nombreColmena.set(colmenaEncontrada['name'] as string);
          }
        }
      });
    }

    if (this.inspeccionId && this.colmenaId) {
      this.cargarDetalleColmena();
    } else {
      this.loading.set(false);
    }
  }

  cargarDetalleColmena(): void {
    this.inspeccionService.getInspeccionColmena(this.inspeccionId, this.colmenaId).subscribe({
      next: (dto) => {
        if (dto) {
          if (dto.varroa) this.varroa.set(dto.varroa);
          if (dto.estadoReina) this.estadoReina.set(dto.estadoReina);
          if (dto.nivelAlimento) this.nivelAlimento.set(dto.nivelAlimento);
          if (dto.produjoMiel !== undefined) this.produjoMiel.set(dto.produjoMiel);
          if (dto.observaciones) this.observaciones = dto.observaciones;
          if (dto.colmenaName) this.nombreColmena.set(dto.colmenaName);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setVarroa(val: 'NO_DETECTADA' | 'DETECTADA'): void {
    this.varroa.set(val);
  }

  setEstadoReina(val: 'VISTA_Y_SANA' | 'NO_VISTA' | 'CELDA_REAL' | 'AUSENTE'): void {
    this.estadoReina.set(val);
  }

  setNivelAlimento(val: 'BAJO' | 'MEDIO' | 'ALTO'): void {
    this.nivelAlimento.set(val);
  }

  setProdujoMiel(val: boolean): void {
    this.produjoMiel.set(val);
  }

  toggleTranscripcion(): void {
    this.mostrarTranscripcion.set(!this.mostrarTranscripcion());
  }

  toggleAudio(): void {
    this.isPlayingAudio.set(!this.isPlayingAudio());
  }

  guardarColmena(): void {
    const payload: InspeccionColmenaDTO = {
      inspeccionId: this.inspeccionId,
      colmenaId: this.colmenaId,
      varroa: this.varroa(),
      estadoReina: this.estadoReina(),
      nivelAlimento: this.nivelAlimento(),
      produjoMiel: this.produjoMiel(),
      observaciones: this.observaciones
    };

    this.inspeccionService.saveInspeccionColmena(this.inspeccionId, this.colmenaId, payload).subscribe({
      next: () => {
        this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
          queryParams: { inspeccionId: this.inspeccionId }
        });
      },
      error: (err) => {
        console.error('Error al guardar inspección de colmena:', err);
        this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
          queryParams: { inspeccionId: this.inspeccionId }
        });
      }
    });
  }
}
