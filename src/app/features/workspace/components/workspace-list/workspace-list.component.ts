import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkspaceService } from '../../../../core/services/workspace.service';
import { Workspace } from '../../../../core/models';

@Component({
  selector: 'app-workspace-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.css']
})
export class WorkspaceListComponent implements OnInit {
  workspaces$ = signal<Workspace[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showCreateDialog = signal(false);

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
      error: (err) => {
        this.error.set('Failed to load workspaces. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getMemberCount(workspace: Workspace): number {
    return workspace.members?.length || 0;
  }

  getUserRole(workspace: Workspace): string {
    const currentUserId = 'current-user-id'; 
    const member = workspace.members?.find(m => m.userId === currentUserId);
    return member?.role || 'viewer';
  }

  openCreateDialog() {
    this.showCreateDialog.set(true);
  }

  deleteWorkspace(workspaceId: string) {
    if (confirm('Are you sure you want to delete this workspace?')) {
      this.workspaceService.delete(workspaceId).subscribe({
        next: () => {
          this.loadWorkspaces();
        },
        error: (err) => {
          alert('Failed to delete workspace. Please try again.');
        }
      });
    }
  }
}