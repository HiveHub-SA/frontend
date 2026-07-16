import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ColmenaService} from '../colmena.service';
import { ColmenaDTO} from '../colmena.model'
import { CommonModule } from '@angular/common';
import { ConfirmDeleteComponent } from '../../confirm-delete-component/confirm-delete-component';

@Component({
  selector: 'app-detalle-colmena',
  imports: [CommonModule, RouterLink, ConfirmDeleteComponent],
  templateUrl: './detalle-colmena.html',
  styleUrl: './detalle-colmena.css',
})
export class ColmenaDetailComponent implements OnInit {
  colmena = signal<ColmenaDTO | null>(null);
  loading = signal<boolean>(true);
  colmenaId!: number | null;

  showDeleteModal = signal<boolean>(false);
  deleting = signal<boolean>(false);
  deleteError = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private colmenaService: ColmenaService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.colmenaId = this.route.snapshot.params['id'];

    if(this.colmenaId) {
      this.colmenaService.getColmenaById(this.colmenaId).subscribe({
        next: data => {
          this.colmena.set(data);
          this.loading.set(false);
        },
        error: error => {
          console.error("Error al traer los datos de la colmena:", error);
          this.loading.set(false);
        }
      })
    }
  }

  loadDetalleColmena(){
    const url = `http://localhost:8080/hivehub/colmenas/${this.colmenaId}`;
    this.http.get(url)
  }

  openDeleteModal()  {
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(){
    this.showDeleteModal.set(false);
  }

  confirmDelete(){
    if (!this.colmenaId) return;
    this.deleting.set(true);
    this.deleteError.set(null);

    this.colmenaService.deleteColmena(this.colmenaId).subscribe({
      next: () => {
        const apiarioId = this.colmena()?.apiarioId;
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.router.navigate(['/apiarios/', apiarioId]);
      },
      error: error => {
        console.error('Error al eliminar la colmena:', error);
        this.deleting.set(false);
        this.deleteError.set('No se pudo eliminar la colmena. Intente nuevamente.');
      }
    });
  }
}
