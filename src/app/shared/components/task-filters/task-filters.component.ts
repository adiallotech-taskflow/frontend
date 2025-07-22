import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../core/models';

export interface TaskFilters {
  myTasks: boolean;
  status: Task['status'][];
  priority: Task['priority'][];
  thisWeek: boolean;
  overdue: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
  active: boolean;
}

@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-filters.component.html',
  styleUrls: ['./task-filters.component.css'],
})
export class TaskFiltersComponent {
  @Input() resultsCount: number = 0;
  @Input() currentUserId?: string;
  @Output() filtersChanged = new EventEmitter<TaskFilters>();

  isFilterPanelOpen = signal(false);

  myTasks = signal(false);
  thisWeek = signal(false);
  overdue = signal(false);

  statusFilters = signal<FilterOption[]>([
    { value: 'todo', label: 'To Do', active: false },
    { value: 'in-progress', label: 'In Progress', active: false },
    { value: 'done', label: 'Done', active: false },
  ]);

  priorityFilters = signal<FilterOption[]>([
    { value: 'high', label: 'High', active: false },
    { value: 'medium', label: 'Medium', active: false },
    { value: 'low', label: 'Low', active: false },
  ]);

  assigneeFilters = signal<FilterOption[]>([
    { value: 'my-tasks', label: 'My Tasks', active: false },
    { value: 'unassigned', label: 'Unassigned', active: false },
  ]);

  hasActiveFilters = computed(() => {
    return (
      this.statusFilters().some((f) => f.active) ||
      this.priorityFilters().some((f) => f.active) ||
      this.assigneeFilters().some((f) => f.active) ||
      this.thisWeek() ||
      this.overdue()
    );
  });

  activeFiltersCount = computed(() => {
    let count = 0;
    count += this.statusFilters().filter((f) => f.active).length;
    count += this.priorityFilters().filter((f) => f.active).length;
    count += this.assigneeFilters().filter((f) => f.active).length;
    if (this.thisWeek()) {
      count++;
    }
    if (this.overdue()) {
      count++;
    }
    return count;
  });

  activeStatusFilters = computed(() =>
    this.statusFilters()
      .filter((f) => f.active)
      .map((f) => f.value as Task['status'])
  );

  activePriorityFilters = computed(() =>
    this.priorityFilters()
      .filter((f) => f.active)
      .map((f) => f.value as Task['priority'])
  );

  toggleFilterPanel() {
    this.isFilterPanelOpen.set(!this.isFilterPanelOpen());
  }

  toggleStatusFilter(index: number) {
    const filters = this.statusFilters();
    filters[index].active = !filters[index].active;
    this.statusFilters.set([...filters]);
    this.emitFilters();
  }

  togglePriorityFilter(index: number) {
    const filters = this.priorityFilters();
    filters[index].active = !filters[index].active;
    this.priorityFilters.set([...filters]);
    this.emitFilters();
  }

  toggleAssigneeFilter(index: number) {
    const filters = this.assigneeFilters();
    filters[index].active = !filters[index].active;
    this.assigneeFilters.set([...filters]);

    if (filters[index].value === 'my-tasks') {
      this.myTasks.set(filters[index].active);
    }

    this.emitFilters();
  }

  toggleTimeFilter(type: 'thisWeek' | 'overdue') {
    if (type === 'thisWeek') {
      this.thisWeek.set(!this.thisWeek());
    } else {
      this.overdue.set(!this.overdue());
    }
    this.emitFilters();
  }

  resetFilters() {
    this.myTasks.set(false);
    this.thisWeek.set(false);
    this.overdue.set(false);

    this.statusFilters.update((filters) => filters.map((f) => ({ ...f, active: false })));

    this.priorityFilters.update((filters) => filters.map((f) => ({ ...f, active: false })));

    this.assigneeFilters.update((filters) => filters.map((f) => ({ ...f, active: false })));

    this.emitFilters();
  }

  private emitFilters() {
    const filters: TaskFilters = {
      myTasks: this.myTasks(),
      status: this.activeStatusFilters(),
      priority: this.activePriorityFilters(),
      thisWeek: this.thisWeek(),
      overdue: this.overdue(),
    };

    this.filtersChanged.emit(filters);
  }
}
