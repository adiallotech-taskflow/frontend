import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);

  show(notification: Omit<Notification, 'id'>) {
    const id = Date.now().toString();
    const newNotification: Notification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification
    };

    // Add notification
    this.notifications.update(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newNotification.duration);
    }
  }

  remove(id: string) {
    this.notifications.update(prev => prev.filter(n => n.id !== id));
  }

  success(title: string, message?: string, duration: number = 5000) {
    this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration: number = 5000) {
    this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message?: string, duration: number = 5000) {
    this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message?: string, duration: number = 5000) {
    this.show({ type: 'info', title, message, duration });
  }
}