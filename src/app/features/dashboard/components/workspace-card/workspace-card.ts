import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Workspace, WorkspaceStats } from '../../../../core/models';

@Component({
  selector: 'app-workspace-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './workspace-card.html',
  styleUrl: './workspace-card.css',
})
export class WorkspaceCardComponent {
  @Input() workspace!: Workspace;
  @Input() stats!: WorkspaceStats;
  @Input() canEdit: boolean = false;

  @Output() edit = new EventEmitter<Workspace>();
  @Output() delete = new EventEmitter<Workspace>();

  showMenu = signal(false);

  toggleMenu(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.showMenu.update(v => !v);
  }

  onEdit(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.showMenu.set(false);
    this.edit.emit(this.workspace);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.showMenu.set(false);
    this.delete.emit(this.workspace);
  }
}
