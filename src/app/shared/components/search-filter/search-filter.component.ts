import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  signal,
  computed,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskFilterOptions, TeamModel, FilterTag, FilterSuggestion } from '../../../core/models';
import { TeamService } from '../../../core/services';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.css'],
})
export class SearchFilterComponent implements OnInit {
  @Input() resultsCount: number = 0;
  @Input() currentUserId?: string;
  @Input() set initialFilters(filters: TaskFilterOptions | null) {
    if (filters) {
      this.pendingFilters = filters;
      this.applyInitialFilters(filters);
    }
  }
  @Output() filtersChanged = new EventEmitter<TaskFilterOptions>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private teamService = inject(TeamService);
  private authService = inject(AuthService);
  pendingFilters: TaskFilterOptions | null = null;

  searchValue = '';
  showSuggestions = false;
  selectedSuggestionIndex = -1;
  isLoadingTeams = signal(false);

  filterTags = signal<FilterTag[]>([]);
  teams = signal<TeamModel[]>([]);

  // Filter syntax patterns
  private filterPatterns = {
    status: /^status:(todo|in-progress|done)$/i,
    priority: /^priority:(high|medium|low)$/i,
    assignee: /^assignee:(me|unassigned)$/i,
    team: /^team:(.+)$/i,
    time: /^(overdue|thisweek)$/i,
  };

  // All possible filter suggestions
  allSuggestions: FilterSuggestion[] = [
    // Status filters
    { type: 'status', value: 'status:todo', label: 'To Do', hint: 'Show tasks in To Do status' },
    { type: 'status', value: 'status:in-progress', label: 'In Progress', hint: 'Show tasks in progress' },
    { type: 'status', value: 'status:done', label: 'Done', hint: 'Show completed tasks' },

    // Priority filters
    { type: 'priority', value: 'priority:high', label: 'High Priority', hint: 'Show high priority tasks' },
    { type: 'priority', value: 'priority:medium', label: 'Medium Priority', hint: 'Show medium priority tasks' },
    { type: 'priority', value: 'priority:low', label: 'Low Priority', hint: 'Show low priority tasks' },

    // Assignee filters
    { type: 'assignee', value: 'assignee:me', label: 'My Tasks', hint: 'Show tasks assigned to you' },
    { type: 'assignee', value: 'assignee:unassigned', label: 'Unassigned', hint: 'Show unassigned tasks' },

    // Time filters
    { type: 'time', value: 'overdue', label: 'Overdue', hint: 'Show overdue tasks' },
    { type: 'time', value: 'thisweek', label: 'This Week', hint: 'Show tasks due this week' },
  ];

  filteredSuggestions = computed(() => {
    if (!this.searchValue.trim()) {
      return this.allSuggestions;
    }

    const search = this.searchValue.toLowerCase();
    return this.allSuggestions.filter(suggestion =>
      suggestion.value.toLowerCase().includes(search) ||
      suggestion.label.toLowerCase().includes(search)
    );
  });

  ngOnInit() {
    this.loadUserTeams();
  }

  private applyInitialFilters(filters: TaskFilterOptions) {
    const tags: FilterTag[] = [];

    // Add team filters
    if (filters.teamIds && filters.teamIds.length > 0) {
      filters.teamIds.forEach(teamId => {
        const team = this.teams().find(t => t.teamId === teamId);
        if (team) {
          tags.push({
            type: 'team',
            value: team.teamId,
            label: team.name,
            color: 'indigo',
          });
        }
      });
    }

    // Add status filters
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach(status => {
        tags.push({
          type: 'status',
          value: status,
          label: this.formatStatusLabel(status),
          color: this.getStatusColor(status),
        });
      });
    }

    // Add priority filters
    if (filters.priority && filters.priority.length > 0) {
      filters.priority.forEach(priority => {
        tags.push({
          type: 'priority',
          value: priority,
          label: this.formatPriorityLabel(priority),
          color: this.getPriorityColor(priority),
        });
      });
    }

    // Add assignee filter
    if (filters.myTasks) {
      tags.push({
        type: 'assignee',
        value: 'me',
        label: 'My Tasks',
        color: 'green',
      });
    }

    // Add time filters
    if (filters.thisWeek) {
      tags.push({
        type: 'time',
        value: 'thisweek',
        label: 'This Week',
        color: 'purple',
      });
    }

    if (filters.overdue) {
      tags.push({
        type: 'time',
        value: 'overdue',
        label: 'Overdue',
        color: 'red',
      });
    }

    this.filterTags.set(tags);
  }

  private loadUserTeams() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.isLoadingTeams.set(true);
      this.teamService.getMyTeams(currentUser.id).subscribe({
        next: (teams) => {
          this.teams.set(teams);
          // Add team suggestions dynamically
          const teamSuggestions = teams.map(team => ({
            type: 'team' as FilterTag['type'],
            value: `team:${team.teamId}`,
            label: team.name,
            hint: `Show tasks from ${team.name}`,
          }));
          this.allSuggestions = [...this.allSuggestions, ...teamSuggestions];
          
          // Re-apply pending filters now that teams are loaded
          if (this.pendingFilters) {
            this.applyInitialFilters(this.pendingFilters);
            this.pendingFilters = null;
          }
          this.isLoadingTeams.set(false);
        },
        error: () => {
          this.isLoadingTeams.set(false);
        }
      });
    }
  }

  onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.selectedSuggestionIndex >= 0) {
        this.selectSuggestion(this.filteredSuggestions()[this.selectedSuggestionIndex]);
      } else {
        this.parseAndAddFilter();
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateSuggestions(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateSuggestions(-1);
    } else if (event.key === 'Escape') {
      this.closeSuggestions();
    } else if (event.key === 'Backspace' && !this.searchValue && this.filterTags().length > 0) {
      // Remove last tag if backspace pressed when input is empty
      this.removeLastTag();
    }
  }

  onInputFocus() {
    this.showSuggestions = true;
  }

  onInputBlur() {
    // Delay to allow click on suggestions
    setTimeout(() => {
      this.closeSuggestions();
    }, 200);
  }

  navigateSuggestions(direction: number) {
    const suggestions = this.filteredSuggestions();
    const maxIndex = suggestions.length - 1;

    if (direction === 1) {
      this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, maxIndex);
    } else {
      this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
    }

    this.showSuggestions = true;
  }

  selectSuggestion(suggestion: FilterSuggestion) {
    this.searchValue = suggestion.value;
    this.parseAndAddFilter();
    this.closeSuggestions();
  }

  parseAndAddFilter() {
    const input = this.searchValue.trim().toLowerCase();
    if (!input) return;

    let tag: FilterTag | null = null;

    // Check status filter
    if (this.filterPatterns.status.test(input)) {
      const match = input.match(/status:(.+)/);
      if (match) {
        tag = {
          type: 'status',
          value: match[1],
          label: this.formatStatusLabel(match[1]),
          color: this.getStatusColor(match[1]),
        };
      }
    }

    // Check priority filter
    else if (this.filterPatterns.priority.test(input)) {
      const match = input.match(/priority:(.+)/);
      if (match) {
        tag = {
          type: 'priority',
          value: match[1],
          label: this.formatPriorityLabel(match[1]),
          color: this.getPriorityColor(match[1]),
        };
      }
    }

    // Check assignee filter
    else if (this.filterPatterns.assignee.test(input)) {
      const match = input.match(/assignee:(.+)/);
      if (match) {
        tag = {
          type: 'assignee',
          value: match[1],
          label: match[1] === 'me' ? 'My Tasks' : 'Unassigned',
          color: 'green',
        };
      }
    }

    // Check team filter
    else if (this.filterPatterns.team.test(input)) {
      const match = input.match(/team:(.+)/);
      if (match) {
        const team = this.teams().find(t => t.teamId === match[1] || t.name.toLowerCase() === match[1]);
        if (team) {
          tag = {
            type: 'team',
            value: team.teamId,
            label: team.name,
            color: 'indigo',
          };
        }
      }
    }

    // Check time filter
    else if (this.filterPatterns.time.test(input)) {
      tag = {
        type: 'time',
        value: input,
        label: input === 'overdue' ? 'Overdue' : 'This Week',
        color: input === 'overdue' ? 'red' : 'purple',
      };
    }

    if (tag && !this.isTagAlreadyAdded(tag)) {
      this.filterTags.update(tags => [...tags, tag!]);
      this.searchValue = '';
      this.emitFilters();
    }

    this.searchValue = '';
  }

  isTagAlreadyAdded(tag: FilterTag): boolean {
    return this.filterTags().some(t => t.type === tag.type && t.value === tag.value);
  }

  removeTag(tag: FilterTag) {
    this.filterTags.update(tags => tags.filter(t => t !== tag));
    this.emitFilters();
  }

  removeLastTag() {
    this.filterTags.update(tags => tags.slice(0, -1));
    this.emitFilters();
  }

  clearAllFilters() {
    this.filterTags.set([]);
    this.searchValue = '';
    this.emitFilters();
  }

  closeSuggestions() {
    this.showSuggestions = false;
    this.selectedSuggestionIndex = -1;
  }

  private emitFilters() {
    const tags = this.filterTags();
    const filters: TaskFilterOptions = {
      myTasks: tags.some(t => t.type === 'assignee' && t.value === 'me'),
      status: tags.filter(t => t.type === 'status').map(t => t.value as Task['status']),
      priority: tags.filter(t => t.type === 'priority').map(t => t.value as Task['priority']),
      thisWeek: tags.some(t => t.type === 'time' && t.value === 'thisweek'),
      overdue: tags.some(t => t.type === 'time' && t.value === 'overdue'),
      teamIds: tags.filter(t => t.type === 'team').map(t => t.value),
    };

    this.filtersChanged.emit(filters);
  }

  private formatStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'done': 'Done',
    };
    return labels[status] || status;
  }

  private formatPriorityLabel(priority: string): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1) + ' Priority';
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'todo': 'gray',
      'in-progress': 'blue',
      'done': 'green',
    };
    return colors[status] || 'gray';
  }

  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'high': 'red',
      'medium': 'yellow',
      'low': 'green',
    };
    return colors[priority] || 'gray';
  }

  getTagColorClasses(color: string): string {
    const colorMap: Record<string, string> = {
      'gray': 'bg-gray-100 text-gray-700 hover:bg-gray-500/20',
      'red': 'bg-red-100 text-red-700 hover:bg-red-600/20',
      'yellow': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-600/20',
      'green': 'bg-green-100 text-green-700 hover:bg-green-600/20',
      'blue': 'bg-blue-100 text-blue-700 hover:bg-blue-600/20',
      'indigo': 'bg-indigo-100 text-indigo-700 hover:bg-indigo-600/20',
      'purple': 'bg-purple-100 text-purple-700 hover:bg-purple-600/20',
    };
    return colorMap[color] || colorMap['gray'];
  }

  getTagStrokeClasses(color: string): string {
    const colorMap: Record<string, string> = {
      'gray': 'stroke-gray-700/50 group-hover:stroke-gray-700/75',
      'red': 'stroke-red-700/50 group-hover:stroke-red-700/75',
      'yellow': 'stroke-yellow-800/50 group-hover:stroke-yellow-800/75',
      'green': 'stroke-green-700/50 group-hover:stroke-green-700/75',
      'blue': 'stroke-blue-700/50 group-hover:stroke-blue-700/75',
      'indigo': 'stroke-indigo-700/50 group-hover:stroke-indigo-700/75',
      'purple': 'stroke-purple-700/50 group-hover:stroke-purple-700/75',
    };
    return colorMap[color] || colorMap['gray'];
  }
}
