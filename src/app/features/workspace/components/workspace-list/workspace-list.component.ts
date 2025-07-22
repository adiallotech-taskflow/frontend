import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkspaceService } from '../../../../core/services';
import { Workspace } from '../../../../core/models';
import { WorkspaceSlideOverComponent } from '../workspace-slide-over';

@Component({
  selector: 'app-workspace-list',
  imports: [CommonModule, RouterLink, WorkspaceSlideOverComponent],
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.css'],
})
export class WorkspaceListComponent implements OnInit {
  workspaces$ = signal<Workspace[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  @ViewChild(WorkspaceSlideOverComponent) slideOver!: WorkspaceSlideOverComponent;

  constructor(private workspaceService: WorkspaceService) {}

  ngOnInit() {
    this.loadWorkspaces();
  }

  loadWorkspaces() {
    this.loading.set(true);
    this.error.set(null);

    this.workspaceService.list().subscribe({
      next: (workspaces) => {
        this.workspaces$.set(workspaces);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load workspaces. Please try again.');
        this.loading.set(false);
      },
    });
  }

  getMemberCount(workspace: Workspace): number {
    return workspace.members?.length || 0;
  }

  getUserRole(workspace: Workspace): string {
    const currentUserId = 'current-user-id';
    const member = workspace.members?.find((m) => m.userId === currentUserId);
    return member?.role || 'viewer';
  }

  openCreateDialog() {
    this.slideOver.open();
  }

  onWorkspaceCreated() {
    this.loadWorkspaces();
  }

  deleteWorkspace(workspaceId: string) {
    if (confirm('Are you sure you want to delete this workspace?')) {
      this.workspaceService.delete(workspaceId).subscribe({
        next: () => {
          this.loadWorkspaces();
        },
        error: () => {
          alert('Failed to delete workspace. Please try again.');
        },
      });
    }
  }
}
