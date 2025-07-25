import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Workspace } from '../../../../core/models';

@Component({
  selector: 'app-workspace-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace-header.component.html',
  styleUrls: ['./workspace-header.component.css'],
})
export class WorkspaceHeaderComponent {
  workspace = input.required<Workspace>();
  canEdit = input<boolean>(false);
  
  edit = output<void>();
  delete = output<void>();
  
  onEdit() {
    this.edit.emit();
  }
  
  onDelete() {
    this.delete.emit();
  }
}