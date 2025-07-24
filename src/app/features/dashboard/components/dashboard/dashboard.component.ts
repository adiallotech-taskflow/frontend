import { Component, OnInit, signal, computed, viewChild, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Workspace, WorkspaceStats, DashboardStats, Task, ConfirmationDialogData } from '../../../../core/models';
import { WorkspaceService, TaskMockService, AuthService } from '../../../../core/services';
import { SearchBarComponent } from '../search-bar/search-bar';
import { StatsOverviewComponent } from '../stats-overview/stats-overview';
import { WorkspaceCardComponent } from '../workspace-card/workspace-card';
import { WorkspaceSkeletonComponent } from '../workspace-skeleton/workspace-skeleton';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { FabButtonComponent } from '../fab-button/fab-button';
import { forkJoin } from 'rxjs';
import { WorkspaceSlideOverComponent } from '../../../workspace/components/workspace-slide-over';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    SearchBarComponent,
    StatsOverviewComponent,
    WorkspaceCardComponent,
    WorkspaceSkeletonComponent,
    EmptyStateComponent,
    FabButtonComponent,
    WorkspaceSlideOverComponent,
    ConfirmationDialogComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  slideOver = viewChild<WorkspaceSlideOverComponent>('slideOver');
  @ViewChild('confirmationDialog') confirmationDialog!: ConfirmationDialogComponent;

  workspaces = signal<Workspace[]>([]);
  allTasks = signal<Task[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  
  private authService = inject(AuthService);
  private workspaceToDelete: Workspace | null = null;
  
  confirmationData: ConfirmationDialogData = {
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  };

  constructor(
    private workspaceService: WorkspaceService,
    private taskService: TaskMockService
  ) {}

  filteredWorkspaces = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.workspaces().filter(
      (workspace) => workspace.name.toLowerCase().includes(term) || workspace.description?.toLowerCase().includes(term)
    );
  });

  totalStats = computed((): DashboardStats => {
    const workspaces = this.workspaces();
    const tasks = this.allTasks();
    const inProgressTasks = tasks.filter((task) => task.status === 'in-progress').length;

    return {
      totalWorkspaces: workspaces.length,
      totalMembers: workspaces.reduce((sum, ws) => sum + ws.members.length, 0),
      totalTasks: tasks.length,
      inProgressTasks: inProgressTasks,
    };
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    forkJoin({
      workspaces: this.workspaceService.list(),
      tasks: this.taskService.getTasks(),
    }).subscribe({
      next: (data) => {
        this.workspaces.set(data.workspaces);

        const tasks = Array.isArray(data.tasks) ? data.tasks : data.tasks.items;
        this.allTasks.set(tasks);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoading.set(false);
      },
    });
  }

  loadWorkspaces() {
    this.loadData();
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm.set(searchTerm);
  }

  createWorkspace() {
    this.slideOver()?.open();
  }

  onWorkspaceCreated(workspace: Workspace) {
    const currentWorkspaces = this.workspaces();
    this.workspaces.set([...currentWorkspaces, workspace]);
  }

  getWorkspaceStats(workspace: Workspace): WorkspaceStats {
    const tasks = this.allTasks();
    const workspaceTasks = tasks.filter((task) => task.workspaceId === workspace.id);
    const completedTasks = workspaceTasks.filter((task) => task.status === 'done').length;
    const inProgressTasks = workspaceTasks.filter((task) => task.status === 'in-progress').length;

    return {
      totalTasks: workspaceTasks.length,
      completedTasks: completedTasks,
      inProgressTasks: inProgressTasks,
      totalMembers: workspace.members.length,
    };
  }
  
  isWorkspaceAdmin(workspace: Workspace): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return false;
    }
    const member = workspace.members?.find((m) => m.userId === currentUser.id);
    return member?.role === 'admin';
  }
  
  editWorkspace(workspace: Workspace) {
    // TODO: Implement edit functionality
    console.log('Edit workspace:', workspace);
  }
  
  deleteWorkspace(workspace: Workspace) {
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
        error: (error) => {
          console.error('Failed to delete workspace:', error);
          this.workspaceToDelete = null;
        },
      });
    }
  }

  onDeleteCancelled() {
    this.workspaceToDelete = null;
  }
}
