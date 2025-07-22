import { Component, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.css',
})
export class ConfirmationDialogComponent {
  isOpen = signal(false);

  data = input<ConfirmationDialogData>({
    title: 'Confirm action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info',
  });

  confirmed = output<void>();
  cancelled = output<void>();

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  onConfirm() {
    this.confirmed.emit();
    this.close();
  }

  onCancel() {
    this.cancelled.emit();
    this.close();
  }

  get iconConfig() {
    switch (this.data().type) {
      case 'danger':
        return {
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600',
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-500 focus-visible:outline-yellow-600',
        };
      default:
        return {
          bgColor: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          buttonColor: 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600',
        };
    }
  }
}
