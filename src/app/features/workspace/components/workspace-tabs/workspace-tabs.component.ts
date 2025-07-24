import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type WorkspaceTab = 'overview' | 'tasks' | 'members';

@Component({
  selector: 'app-workspace-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace-tabs.component.html',
  styleUrls: ['./workspace-tabs.component.css'],
})
export class WorkspaceTabsComponent {
  activeTab = input.required<WorkspaceTab>();
  taskCount = input<number>(0);
  memberCount = input<number>(0);
  
  tabChange = output<WorkspaceTab>();

  setActiveTab(tab: WorkspaceTab) {
    this.tabChange.emit(tab);
  }
}