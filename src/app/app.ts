import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { NavbarComponent } from './navbar/navbar.component';
import { NotificacionesClima } from '../app/notificaciones-clima/notificaciones-clima';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavbarComponent, NotificacionesClima],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App { }
