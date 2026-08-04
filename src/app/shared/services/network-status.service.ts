import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription, timeout } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NetworkStatusService implements OnDestroy {

    private http = inject(HttpClient);
    private zone = inject(NgZone);
    private readonly API_URL = 'http://localhost:8080';
    private readonly POLLING_INTERVAL = 5000;
    private readonly RECOVERY_DELAY = 500;

    readonly online = signal<boolean>(navigator.onLine);

    private polling?: Subscription;

    constructor() {

        window.addEventListener('online', this.onBrowserOnline);

        window.addEventListener('offline', this.onBrowserOffline);

        this.iniciarPolling();

    }

    private iniciarPolling(): void {

        this.verificarConexion();

        this.polling = interval(this.POLLING_INTERVAL).subscribe(() => {

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

        this.http.get(
            `${this.API_URL}/health?t=${Date.now()}`,
            {
                responseType: 'text'
            }
        ).pipe(
            timeout(3000)
        ).subscribe({

            next: () => {

                this.online.set(true);

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
            setTimeout(
                () => this.verificarConexion(),
                this.RECOVERY_DELAY
            );

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