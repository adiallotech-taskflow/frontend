import { Component, Input, Output, EventEmitter, signal, computed, HostListener, ElementRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskFilterOptions, FilterOption } from '../../../core/models';
import { TeamService } from '../../../core/services';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-filters.component.html',
  styleUrls: ['./task-filters.component.css'],
})
export class TaskFiltersComponent implements OnInit {
  @Input() resultsCount: number = 0;
  @Input() currentUserId?: string;
  @Output() filtersChanged = new EventEmitter<TaskFilterOptions>();

  private teamService = inject(TeamService);
  private authService = inject(AuthService);

  constructor(private elementRef: ElementRef) {}

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

  teamFilters = signal<FilterOption[]>([]);

  hasActiveFilters = computed(() => {
    return (
      this.statusFilters().some((f) => f.active) ||
      this.priorityFilters().some((f) => f.active) ||
      this.assigneeFilters().some((f) => f.active) ||
      this.teamFilters().some((f) => f.active) ||
      this.thisWeek() ||
      this.overdue()
    );
  });

  activeFiltersCount = computed(() => {
    let count = 0;
    count += this.statusFilters().filter((f) => f.active).length;
    count += this.priorityFilters().filter((f) => f.active).length;
    count += this.assigneeFilters().filter((f) => f.active).length;
    count += this.teamFilters().filter((f) => f.active).length;
    if (this.thisWeek()) {
      count++;
    }
    if (this.overdue()) {
      count++;
    }
    return count;
  });

  activeFilterBadges = computed(() => {
    const badges: Array<{ label: string; value: string; type: string; index?: number }> = [];

    // Status filters
    this.statusFilters().forEach((filter, index) => {
      if (filter.active) {
        badges.push({ label: filter.label, value: filter.value, type: 'status', index });
      }
    });

    // Priority filters
    this.priorityFilters().forEach((filter, index) => {
      if (filter.active) {
        badges.push({ label: filter.label, value: filter.value, type: 'priority', index });
      }
    });

    // Assignee filters
    this.assigneeFilters().forEach((filter, index) => {
      if (filter.active) {
        badges.push({ label: filter.label, value: filter.value, type: 'assignee', index });
      }
    });

    // Team filters
    this.teamFilters().forEach((filter, index) => {
      if (filter.active) {
        badges.push({ label: filter.label, value: filter.value, type: 'team', index });
      }
    });

    // Time filters
    if (this.thisWeek()) {
      badges.push({ label: 'This Week', value: 'thisWeek', type: 'time' });
    }
    if (this.overdue()) {
      badges.push({ label: 'Overdue', value: 'overdue', type: 'time' });
    }

    return badges;
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

  activeTeamFilters = computed(() =>
    this.teamFilters()
      .filter((f) => f.active)
      .map((f) => f.value)
  );

  ngOnInit() {
    this.loadUserTeams();
  }

  private loadUserTeams() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.teamService.getMyTeams(currentUser.id).subscribe({
        next: (teams) => {
          const teamFilterOptions = teams.map(team => ({
            value: team.teamId,
            label: team.name,
            active: false
          }));
          this.teamFilters.set(teamFilterOptions);
        }
      });
    }
  }

  toggleFilterPanel() {
    this.isFilterPanelOpen.set(!this.isFilterPanelOpen());
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.isFilterPanelOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isFilterPanelOpen.set(false);
    }
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

  toggleTeamFilter(index: number) {
    const filters = this.teamFilters();
    filters[index].active = !filters[index].active;
    this.teamFilters.set([...filters]);
    this.emitFilters();
  }

  resetFilters() {
    this.myTasks.set(false);
    this.thisWeek.set(false);
    this.overdue.set(false);

    this.statusFilters.update((filters) => filters.map((f) => ({ ...f, active: false })));

    this.priorityFilters.update((filters) => filters.map((f) => ({ ...f, active: false })));

    this.assigneeFilters.update((filters) => filters.map((f) => ({ ...f, active: false })));

    this.teamFilters.update((filters) => filters.map((f) => ({ ...f, active: false })));

    this.emitFilters();
  }

  removeFilter(badge: { type: string; value: string; index?: number }) {
    switch (badge.type) {
      case 'status':
        if (badge.index !== undefined) {
          this.toggleStatusFilter(badge.index);
        }
        break;
      case 'priority':
        if (badge.index !== undefined) {
          this.togglePriorityFilter(badge.index);
        }
        break;
      case 'assignee':
        if (badge.index !== undefined) {
          this.toggleAssigneeFilter(badge.index);
        }
        break;
      case 'team':
        if (badge.index !== undefined) {
          this.toggleTeamFilter(badge.index);
        }
        break;
      case 'time':
        if (badge.value === 'thisWeek') {
          this.toggleTimeFilter('thisWeek');
        } else if (badge.value === 'overdue') {
          this.toggleTimeFilter('overdue');
        }
        break;
    }
  }

  getBadgeColorClasses(type: string): string {
    switch (type) {
      case 'status':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-600/20 stroke-blue-700/50 group-hover:stroke-blue-700/75';
      case 'priority':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-600/20 stroke-yellow-800/50 group-hover:stroke-yellow-800/75';
      case 'assignee':
        return 'bg-green-100 text-green-700 hover:bg-green-600/20 stroke-green-700/50 group-hover:stroke-green-700/75';
      case 'team':
        return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-600/20 stroke-indigo-700/50 group-hover:stroke-indigo-700/75';
      case 'time':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-600/20 stroke-purple-700/50 group-hover:stroke-purple-700/75';
      default:
        return 'bg-gray-100 text-gray-600 hover:bg-gray-500/20 stroke-gray-700/50 group-hover:stroke-gray-700/75';
    }
  }

  private emitFilters() {
    const filters: TaskFilterOptions = {
      myTasks: this.myTasks(),
      status: this.activeStatusFilters(),
      priority: this.activePriorityFilters(),
      thisWeek: this.thisWeek(),
      overdue: this.overdue(),
      teamIds: this.activeTeamFilters(),
    };

    this.filtersChanged.emit(filters);
  }
}
