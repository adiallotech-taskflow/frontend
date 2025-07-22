import { Component, Input } from '@angular/core';
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
}
