import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-workspace-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace-error.component.html',
  styleUrls: ['./workspace-error.component.css'],
})
export class WorkspaceErrorComponent {
  errorMessage = input<string>('Failed to load workspace details');
  
  retry = output<void>();
  
  onRetry() {
    this.retry.emit();
  }
}