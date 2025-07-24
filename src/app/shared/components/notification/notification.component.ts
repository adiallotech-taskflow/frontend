import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(100%) translateX(0)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0) translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationComponent {
  private notificationService = inject(NotificationService);

  notifications = computed(() => this.notificationService.notifications());

  getIcon(type: string) {
    switch (type) {
      case 'success':
        return {
          class: 'text-green-400',
          path: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
        };
      case 'error':
        return {
          class: 'text-red-400',
          path: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
        };
      case 'warning':
        return {
          class: 'text-yellow-400',
          path: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z'
        };
      default:
        return {
          class: 'text-blue-400',
          path: 'M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'
        };
    }
  }

  removeNotification(id: string) {
    this.notificationService.remove(id);
  }
}
