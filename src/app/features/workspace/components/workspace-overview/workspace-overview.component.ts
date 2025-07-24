import { Component, input, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Workspace, Task } from '../../../../core/models';

@Component({
  selector: 'app-workspace-overview',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './workspace-overview.component.html',
  styleUrls: ['./workspace-overview.component.css'],
})
export class WorkspaceOverviewComponent {
  workspace = input.required<Workspace>();
  tasks = input.required<Task[]>();
  
  taskStats = computed(() => {
    const allTasks = this.tasks();
    return {
      todo: allTasks.filter((t) => t.status === 'todo').length,
      inProgress: allTasks.filter((t) => t.status === 'in-progress').length,
      done: allTasks.filter((t) => t.status === 'done').length,
      total: allTasks.length,
    };
  });
}