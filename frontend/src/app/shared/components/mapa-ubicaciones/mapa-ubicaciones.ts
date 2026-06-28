import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';

export interface CoordenadasSeleccionadas {
  latitud: number;
  longitud: number;
}

export interface PuntoMapa {
  latitud: number;
  longitud: number;
  titulo?: string;
  descripcion?: string;
  tipo?: 'HOSPITAL' | 'EMERGENCIA' | 'BANCO_SANGRE' | string;
}

@Component({
  selector: 'app-mapa-ubicaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-ubicaciones.html'
})
export class MapaUbicacionesComponent implements AfterViewInit, OnChanges, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef<HTMLDivElement>;

  @Input() latitud: number | string | null = null;
  @Input() longitud: number | string | null = null;

  @Input() puntos: PuntoMapa[] = [];
  @Input() modoSeleccion = false;
  @Input() zoom = 13;
  @Input() altura = '360px';
  @Input() titulo = 'Ubicación seleccionada';
  @Input() descripcion = 'Haz click en el mapa para seleccionar una ubicación.';

  @Output() coordenadasSeleccionadas = new EventEmitter<CoordenadasSeleccionadas>();

  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;

  private latitudInterna: number | null = null;
  private longitudInterna: number | null = null;

  private readonly centroDefault: L.LatLngExpression = [-17.7833, -63.1821];

  private clickHandler = (event: L.LeafletMouseEvent) => {
    this.ngZone.run(() => {
      this.seleccionarCoordenadas(event.latlng.lat, event.latlng.lng);
    });
  };

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      this.inicializarMapa();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) {
      return;
    }

    this.configurarEventoSeleccion();
    this.renderizarMarcadores();
    this.ajustarVista();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }
  }

  private inicializarMapa(): void {
    if (this.map) {
      return;
    }

    const centro = this.obtenerCentroInicial();

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      attributionControl: true
    }).setView(centro, this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);

    this.configurarEventoSeleccion();
    this.renderizarMarcadores();

    setTimeout(() => {
      this.map?.invalidateSize();
      this.ajustarVista();
    }, 150);
  }

  private configurarEventoSeleccion(): void {
    if (!this.map) {
      return;
    }

    this.map.off('click', this.clickHandler);

    if (this.modoSeleccion) {
      this.map.on('click', this.clickHandler);
    }
  }

  private renderizarMarcadores(): void {
    if (!this.map || !this.markerLayer) {
      return;
    }

    this.markerLayer.clearLayers();

    const puntosValidos = this.puntos.filter((punto) =>
      this.coordenadasValidas(Number(punto.latitud), Number(punto.longitud))
    );

    puntosValidos.forEach((punto) => {
      const marker = L.marker([Number(punto.latitud), Number(punto.longitud)], {
        icon: this.crearIconoPorTipo(punto.tipo)
      });

      marker.bindPopup(this.crearPopupPunto(punto));
      marker.addTo(this.markerLayer!);
    });

    const lat = this.obtenerLatitudActual();
    const lng = this.obtenerLongitudActual();

    if (this.coordenadasValidas(lat, lng)) {
      const markerSeleccion = L.marker([lat!, lng!], {
        icon: this.crearIconoSeleccion(),
        draggable: this.modoSeleccion
      });

      markerSeleccion.bindPopup(this.crearPopupSeleccion(lat!, lng!));

      if (this.modoSeleccion) {
        markerSeleccion.on('dragend', (event) => {
          const marker = event.target as L.Marker;
          const position = marker.getLatLng();

          this.ngZone.run(() => {
            this.seleccionarCoordenadas(position.lat, position.lng);
          });
        });
      }

      markerSeleccion.addTo(this.markerLayer);
    }
  }

  private ajustarVista(): void {
    if (!this.map) {
      return;
    }

    setTimeout(() => {
      this.map?.invalidateSize();

      const lat = this.obtenerLatitudActual();
      const lng = this.obtenerLongitudActual();

      if (this.coordenadasValidas(lat, lng)) {
        this.map?.setView([lat!, lng!], this.zoom);
        return;
      }

      const puntosValidos = this.puntos.filter((punto) =>
        this.coordenadasValidas(Number(punto.latitud), Number(punto.longitud))
      );

      if (puntosValidos.length > 0) {
        const bounds = L.latLngBounds(
          puntosValidos.map((punto) => [Number(punto.latitud), Number(punto.longitud)])
        );

        this.map?.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: this.zoom
        });
      }
    }, 100);
  }

  seleccionarCoordenadas(latitud: number, longitud: number): void {
    const lat = this.redondearCoordenada(latitud);
    const lng = this.redondearCoordenada(longitud);

    this.latitudInterna = lat;
    this.longitudInterna = lng;

    this.coordenadasSeleccionadas.emit({
      latitud: lat,
      longitud: lng
    });

    this.renderizarMarcadores();
    this.cdr.detectChanges();
  }

  usarMiUbicacion(): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          this.seleccionarCoordenadas(
            position.coords.latitude,
            position.coords.longitude
          );

          this.map?.setView(
            [position.coords.latitude, position.coords.longitude],
            this.zoom
          );
        });
      },
      () => {
        console.warn('No se pudo obtener la ubicación del dispositivo.');
      },
      {
        enableHighAccuracy: true,
        timeout: 8000
      }
    );
  }

  limpiarSeleccion(): void {
    this.latitudInterna = null;
    this.longitudInterna = null;

    this.coordenadasSeleccionadas.emit({
      latitud: 0,
      longitud: 0
    });

    this.renderizarMarcadores();
    this.cdr.detectChanges();
  }

  get tieneCoordenadas(): boolean {
    return this.coordenadasValidas(
      this.obtenerLatitudActual(),
      this.obtenerLongitudActual()
    );
  }

  get coordenadasTexto(): string {
    const lat = this.obtenerLatitudActual();
    const lng = this.obtenerLongitudActual();

    if (!this.coordenadasValidas(lat, lng)) {
      return 'Sin coordenadas seleccionadas';
    }

    return `${lat}, ${lng}`;
  }

  private obtenerCentroInicial(): L.LatLngExpression {
    const lat = this.obtenerLatitudActual();
    const lng = this.obtenerLongitudActual();

    if (this.coordenadasValidas(lat, lng)) {
      return [lat!, lng!];
    }

    const primerPunto = this.puntos.find((punto) =>
      this.coordenadasValidas(Number(punto.latitud), Number(punto.longitud))
    );

    if (primerPunto) {
      return [Number(primerPunto.latitud), Number(primerPunto.longitud)];
    }

    return this.centroDefault;
  }

  private obtenerLatitudActual(): number | null {
    if (this.latitudInterna !== null) {
      return this.latitudInterna;
    }

    return this.normalizarNumero(this.latitud);
  }

  private obtenerLongitudActual(): number | null {
    if (this.longitudInterna !== null) {
      return this.longitudInterna;
    }

    return this.normalizarNumero(this.longitud);
  }

  private normalizarNumero(valor: number | string | null | undefined): number | null {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : null;
  }

  private coordenadasValidas(latitud: number | null, longitud: number | null): boolean {
    if (latitud === null || longitud === null) {
      return false;
    }

    return (
      Number.isFinite(latitud) &&
      Number.isFinite(longitud) &&
      latitud >= -90 &&
      latitud <= 90 &&
      longitud >= -180 &&
      longitud <= 180 &&
      !(latitud === 0 && longitud === 0)
    );
  }

  private redondearCoordenada(valor: number): number {
    return Number(valor.toFixed(7));
  }

  private crearIconoSeleccion(): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: #9B1A1A;
          border: 4px solid white;
          box-shadow: 0 8px 20px rgba(0,0,0,.28);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            border-radius: 999px;
            background: white;
          "></div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -16]
    });
  }

  private crearIconoPorTipo(tipo?: string): L.DivIcon {
    const color = tipo === 'EMERGENCIA' ? '#9B1A1A' : '#374151';

    return L.divIcon({
      className: '',
      html: `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 6px 14px rgba(0,0,0,.24);
        "></div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  }

  private crearPopupSeleccion(latitud: number, longitud: number): string {
    return `
      <strong>${this.titulo}</strong><br>
      Lat: ${latitud}<br>
      Lng: ${longitud}
    `;
  }

  private crearPopupPunto(punto: PuntoMapa): string {
    return `
      <strong>${punto.titulo || 'Ubicación'}</strong><br>
      ${punto.descripcion || ''}<br>
      Lat: ${punto.latitud}<br>
      Lng: ${punto.longitud}
    `;
  }
}