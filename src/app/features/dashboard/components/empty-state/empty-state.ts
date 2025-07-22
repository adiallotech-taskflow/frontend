import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  imports: [CommonModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyStateComponent {
  @Input() type: 'no-workspaces' | 'no-results' = 'no-workspaces';
  @Output() createWorkspace = new EventEmitter<void>();

  onCreateWorkspace() {
    this.createWorkspace.emit();
  }
}
