import { Injectable, NgZone, OnDestroy, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NetworkStatusService implements OnDestroy {

    private http = inject(HttpClient);
    private zone = inject(NgZone);

    readonly online = signal<boolean>(navigator.onLine);

    private polling?: Subscription;

    constructor() {

        effect(() => {
            console.log("ONLINE =", this.online());
        });
        window.addEventListener('online', this.onBrowserOnline);

        window.addEventListener('offline', this.onBrowserOffline);

        this.iniciarPolling();
    }

    private iniciarPolling(): void {

        this.verificarConexion();

        this.polling = interval(5000).subscribe(() => {

            if (!navigator.onLine) {

                this.online.set(false);
                return;

            }

            this.verificarConexion();

        });

    }

    private verificarConexion(): void {

        // Si el navegador ya sabe que no hay red,
        // no tiene sentido consultar al backend.
        if (!navigator.onLine) {
            this.online.set(false);
            return;
        }

        this.http.get('/health', {
            responseType: 'text'
        }).subscribe({

            next: () => {

                // Sólo estamos online si:
                // 1) el navegador tiene red
                // 2) el backend respondió
                this.online.set(navigator.onLine);

            },

            error: () => {

                this.online.set(false);

            }

        });

    }

    private onBrowserOnline = () => {

        this.zone.run(() => {

            // Esperamos un instante para que la interfaz de red
            // realmente vuelva antes de consultar el backend.
            setTimeout(() => this.verificarConexion(), 500);

        });

    };

    private onBrowserOffline = () => {

        this.zone.run(() => {

            this.online.set(false);

        });

    };

    ngOnDestroy(): void {

        this.polling?.unsubscribe();

        window.removeEventListener('online', this.onBrowserOnline);

        window.removeEventListener('offline', this.onBrowserOffline);

    }

}