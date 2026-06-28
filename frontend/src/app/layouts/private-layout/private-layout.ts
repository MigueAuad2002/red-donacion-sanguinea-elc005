import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WsStatusComponent } from '../../shared/components/ws-status/ws-status';
import { NotificationWsService } from '../../services/notificaciones-ws';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [RouterOutlet, WsStatusComponent],
  templateUrl: './private-layout.html'
})
export class PrivateLayoutComponent implements OnInit, OnDestroy {
  private notificationWsService = inject(NotificationWsService);

  ngOnInit(): void {
    this.notificationWsService.connect();
  }

  ngOnDestroy(): void {
    this.notificationWsService.disconnect();
  }
}