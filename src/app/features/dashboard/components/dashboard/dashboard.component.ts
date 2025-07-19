import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Workspace, WorkspaceStats, DashboardStats } from '../../../../core/models';
import { SearchBarComponent } from '../search-bar/search-bar';
import { StatsOverviewComponent } from '../stats-overview/stats-overview';
import { WorkspaceCardComponent } from '../workspace-card/workspace-card';
import { WorkspaceSkeletonComponent } from '../workspace-skeleton/workspace-skeleton';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { FabButtonComponent } from '../fab-button/fab-button';

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
    FabButtonComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // State
  workspaces = signal<Workspace[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');

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

    // Simulate API call with mock data
    setTimeout(() => {
      const mockWorkspaces: Workspace[] = [
        {
          id: '1',
          name: 'Marketing Campaign',
          description: 'Q1 2024 marketing initiatives and campaigns',
          ownerId: 'user1',
          members: [
            { userId: 'user1', role: 'admin', joinedAt: new Date() },
            { userId: 'user2', role: 'member', joinedAt: new Date() },
            { userId: 'user3', role: 'member', joinedAt: new Date() }
          ],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Product Development',
          description: 'New feature development and bug fixes',
          ownerId: 'user1',
          members: [
            { userId: 'user1', role: 'admin', joinedAt: new Date() },
            { userId: 'user4', role: 'member', joinedAt: new Date() },
            { userId: 'user5', role: 'viewer', joinedAt: new Date() }
          ],
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date()
        },
        {
          id: '3',
          name: 'Design System',
          description: 'Building and maintaining the design system',
          ownerId: 'user2',
          members: [
            { userId: 'user2', role: 'admin', joinedAt: new Date() },
            { userId: 'user6', role: 'member', joinedAt: new Date() }
          ],
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date()
        }
      ];

      this.workspaces.set(mockWorkspaces);
      this.isLoading.set(false);
    }, 1500); // Simulate loading time
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm.set(searchTerm);
  }

  createWorkspace() {
    // TODO: Navigate to workspace creation or open modal
    console.log('Create workspace clicked');
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
