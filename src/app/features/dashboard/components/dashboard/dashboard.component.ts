import { Component, OnInit, signal, computed, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Workspace, WorkspaceStats, DashboardStats } from '../../../../core/models';
import { WorkspaceService } from '../../../../core/services';
import { SearchBarComponent } from '../search-bar/search-bar';
import { StatsOverviewComponent } from '../stats-overview/stats-overview';
import { WorkspaceCardComponent } from '../workspace-card/workspace-card';
import { WorkspaceSkeletonComponent } from '../workspace-skeleton/workspace-skeleton';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { FabButtonComponent } from '../fab-button/fab-button';
import { WorkspaceSlideOverComponent } from '../../../workspace/workspace-slide-over';

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
  isLoading = signal(true);
  searchTerm = signal('');

  constructor(private workspaceService: WorkspaceService) {}

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
    return {
      totalWorkspaces: workspaces.length,
      totalMembers: workspaces.reduce((sum, ws) => sum + ws.members.length, 0),
      totalTasks: this.getMockTaskCount(),
      inProgressTasks: Math.floor(this.getMockTaskCount() * 0.4)
    };
  });

  ngOnInit() {
    this.loadWorkspaces();
  }

  loadWorkspaces() {
    this.isLoading.set(true);

    this.workspaceService.list().subscribe({
      next: (workspaces) => {
        this.workspaces.set(workspaces);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading workspaces:', error);
        this.isLoading.set(false);
      }
    });
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
    const taskCount = Math.floor(Math.random() * 20) + 5;
    const completedRatio = Math.random() * 0.8 + 0.1;

    return {
      totalTasks: taskCount,
      completedTasks: Math.floor(taskCount * completedRatio),
      inProgressTasks: Math.floor(taskCount * (1 - completedRatio)),
      totalMembers: workspace.members.length
    };
  }

  private getMockTaskCount(): number {
    return this.workspaces().length * 8; // Mock: 8 tasks per workspace on average
  }
}
