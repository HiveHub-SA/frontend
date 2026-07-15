import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ColmenaService} from '../colmena.service';
import { ColmenaDTO} from '../colmena.model'
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detalle-colmena',
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-colmena.html',
  styleUrl: './detalle-colmena.css',
})
export class ColmenaDetailComponent implements OnInit {
  colmena = signal<ColmenaDTO | null>(null);
  loading = signal<boolean>(true);
  colmenaId!: number | null;

  constructor(
    private route: ActivatedRoute,
    private colmenaService: ColmenaService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    //Capturamos el id desde la url

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


}
