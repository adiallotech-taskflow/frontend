import { Component, OnInit, signal, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkspaceService, AuthService } from '../../../../core/services';
import { Workspace, ConfirmationDialogData } from '../../../../core/models';
import { WorkspaceSlideOverComponent } from '../workspace-slide-over';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-workspace-list',
  imports: [CommonModule, RouterLink, WorkspaceSlideOverComponent, ConfirmationDialogComponent],
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.css'],
})
export class WorkspaceListComponent implements OnInit {
  workspaces$ = signal<Workspace[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  @ViewChild(WorkspaceSlideOverComponent) slideOver!: WorkspaceSlideOverComponent;
  @ViewChild('confirmationDialog') confirmationDialog!: ConfirmationDialogComponent;

  private authService = inject(AuthService);
  private workspaceToDelete: Workspace | null = null;

  confirmationData: ConfirmationDialogData = {
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  };

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
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return 'viewer';
    }
    const member = workspace.members?.find((m) => m.userId === currentUser.id);
    return member?.role || 'viewer';
  }

  openCreateDialog() {
    this.slideOver.open();
  }

  onWorkspaceCreated() {
    this.loadWorkspaces();
  }

  deleteWorkspace(workspaceId: string) {
    const workspace = this.workspaces$().find(w => w.id === workspaceId);
    if (!workspace) return;

    this.workspaceToDelete = workspace;
    this.confirmationData = {
      title: 'Delete Workspace',
      message: `Are you sure you want to delete "${workspace.name}"? This action cannot be undone and will delete all associated tasks.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    };

    this.confirmationDialog.open();
  }

  onDeleteConfirmed() {
    if (this.workspaceToDelete) {
      this.workspaceService.delete(this.workspaceToDelete.id).subscribe({
        next: () => {
          this.loadWorkspaces();
          this.workspaceToDelete = null;
        },
        error: () => {
          this.error.set('Failed to delete workspace. Please try again.');
          this.workspaceToDelete = null;
        },
      });
    }
  }

  onDeleteCancelled() {
    this.workspaceToDelete = null;
  }
}
