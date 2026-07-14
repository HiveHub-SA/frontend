import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { ApiarioDTO } from '../apiario.model';
import { ApiarioService } from '../apiario.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-detalle-apiario',
  imports: [CommonModule, RouterLink, FormsModule,],
  templateUrl: './detalle-apiario.html',
  styleUrl: './detalle-apiario.css',
})
export class ApiarioDetailComponent implements OnInit {

//We use signal to capture the apiario. Initially is null

  apiario = signal<ApiarioDTO | null>(null);
  loading = signal<boolean>(true)
  apiarioId!: number | null;

  constructor(
    private route: ActivatedRoute,
    private apiarioService: ApiarioService,
    private http: HttpClient){}

  ngOnInit(): void {

    this.apiarioId = this.route.snapshot.params['id'];

    if (this.apiarioId) {
      this.apiarioService.getApiarioById(this.apiarioId).subscribe({
        next: (data) => {
          this.apiario.set(data);
          this.loading.set(false);
        },
        error: (error) => {
          console.error("Error al traer los datos del apario:", error);
          this.loading.set(false);
        }
      })
    }
  }

  showForm: boolean = false;

  newColmena = {
    name: "",
    apiarioId: 0
  }

  toggleForm(){
    this.showForm = !this.showForm;
  }

  cleanForm(){
    this.newColmena = {name: "", apiarioId: 0};
  }

  createColmena(){
    if (this.apiarioId){
      this.newColmena.apiarioId = this.apiarioId;
    } else {
      console.error("No se pudo obtener el apiarioId de la URL");
      return;
    }

    const url = "http://localhost:8080/hivehub/colmenas";

    this.http.post(url, this.newColmena).subscribe({
      next: (respuesta) => {
        console.log("colmena creada", respuesta);

        this.showForm = false;
        this.cleanForm();

        if (this.apiarioId){
          this.apiarioService.getApiarioById(this.apiarioId).subscribe({
            next: (data) => this.apiario.set(data),
            error: (error) => console.error("Error al refrescar la lista:", error)
          });
        }
      },
      error: (error) => {
        console.error("Error en el servidor al crear la colmena:", error)
      }
    });
  }

}
