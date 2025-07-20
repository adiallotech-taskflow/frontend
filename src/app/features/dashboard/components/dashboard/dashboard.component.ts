import { Component, OnInit, signal, computed, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Workspace, WorkspaceStats, DashboardStats, Task } from '../../../../core/models';
import { WorkspaceService, TaskMockService } from '../../../../core/services';
import { SearchBarComponent } from '../search-bar/search-bar';
import { StatsOverviewComponent } from '../stats-overview/stats-overview';
import { WorkspaceCardComponent } from '../workspace-card/workspace-card';
import { WorkspaceSkeletonComponent } from '../workspace-skeleton/workspace-skeleton';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { FabButtonComponent } from '../fab-button/fab-button';
import { WorkspaceSlideOverComponent } from '../../../workspace/workspace-slide-over';
import { forkJoin } from 'rxjs';

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
    WorkspaceSlideOverComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // ViewChild for slide-over component
  slideOver = viewChild<WorkspaceSlideOverComponent>('slideOver');

  // State
  workspaces = signal<Workspace[]>([]);
  allTasks = signal<Task[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');

  constructor(
    private workspaceService: WorkspaceService,
    private taskService: TaskMockService
  ) {}

  // Computed values
  filteredWorkspaces = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.workspaces().filter(workspace =>
      workspace.name.toLowerCase().includes(term) ||
      workspace.description?.toLowerCase().includes(term)
    );
  });

  totalStats = computed((): DashboardStats => {
    const workspaces = this.workspaces();
    const tasks = this.allTasks();
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    
    return {
      totalWorkspaces: workspaces.length,
      totalMembers: workspaces.reduce((sum, ws) => sum + ws.members.length, 0),
      totalTasks: tasks.length,
      inProgressTasks: inProgressTasks
    };
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    // Load workspaces and tasks in parallel
    forkJoin({
      workspaces: this.workspaceService.list(),
      tasks: this.taskService.getTasks()
    }).subscribe({
      next: (data) => {
        this.workspaces.set(data.workspaces);
        // getTasks returns either Task[] or PaginationResult<Task>
        const tasks = Array.isArray(data.tasks) ? data.tasks : data.tasks.items;
        this.allTasks.set(tasks);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoading.set(false);
      }
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
    // Add the newly created workspace to the local state
    const currentWorkspaces = this.workspaces();
    this.workspaces.set([...currentWorkspaces, workspace]);
    console.log('Workspace créé avec succès:', workspace);
  }

  getWorkspaceStats(workspace: Workspace): WorkspaceStats {
    const tasks = this.allTasks();
    const workspaceTasks = tasks.filter(task => task.workspaceId === workspace.id);
    const completedTasks = workspaceTasks.filter(task => task.status === 'done').length;
    const inProgressTasks = workspaceTasks.filter(task => task.status === 'in-progress').length;

    return {
      totalTasks: workspaceTasks.length,
      completedTasks: completedTasks,
      inProgressTasks: inProgressTasks,
      totalMembers: workspace.members.length
    };
  }
}
