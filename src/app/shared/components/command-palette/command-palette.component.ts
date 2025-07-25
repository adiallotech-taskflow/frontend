import {Component, signal, computed, HostListener, inject, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, combineLatest, of, catchError } from 'rxjs';
import { WorkspaceService, TaskService, UserService, TeamService } from '../../../core/services';
import { Workspace, Task, SearchResult } from '../../../core/models';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.css']
})
export class CommandPaletteComponent implements OnDestroy {
  private router = inject(Router);
  private workspaceService = inject(WorkspaceService);
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private teamService = inject(TeamService);

  isOpen = signal(false);
  searchQuery = signal('');
  isSearching = signal(false);
  searchResults = signal<{
    workspaces: Workspace[];
    tasks: Task[];
  }>({ workspaces: [], tasks: [] });
  selectedIndex = signal(0);

  constructor() {
    // Pre-fetch users and teams data for helper methods
    this.userService.getUsers().subscribe();
    this.teamService.getAllTeams().subscribe();
  }

  private searchSubject = new Subject<string>();
  private searchSubscription = this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query => {
      if (!query.trim()) {
        return combineLatest([of([]), of([])]);
      }
      this.isSearching.set(true);
      return combineLatest([
        this.workspaceService.search(query).pipe(
          catchError(err => {
            console.error('Workspace search error:', err);
            return of([]);
          })
        ),
        this.taskService.search(query).pipe(
          catchError(err => {
            console.error('Task search error:', err);
            return of([]);
          })
        )
      ]);
    })
  ).subscribe(([workspaces, tasks]) => {
    this.searchResults.set({ workspaces, tasks });
    this.isSearching.set(false);
    // Don't auto-select first item
    this.selectedIndex.set(-1);
  });

  hasResults = computed(() => {
    const results = this.searchResults();
    return results.workspaces.length > 0 || results.tasks.length > 0;
  });

  totalResults = computed(() => {
    const results = this.searchResults();
    return results.workspaces.length + results.tasks.length;
  });

  flatResults = computed((): SearchResult[] => {
    const results = this.searchResults();
    const flattened: SearchResult[] = [];

    results.workspaces.forEach(workspace => {
      flattened.push({ type: 'workspace', item: workspace });
    });

    results.tasks.forEach(task => {
      flattened.push({ type: 'task', item: task });
    });

    return flattened;
  });

  selectedItem = computed((): SearchResult | null => {
    const index = this.selectedIndex();
    if (index === -1) return null;
    
    const results = this.flatResults();
    return results[index] || null;
  });

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Open with Cmd+K or Ctrl+K
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.open();
    }

    // Close with Escape
    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }

    // Navigate with arrow keys
    if (this.isOpen()) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.moveSelection(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.moveSelection(-1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.selectCurrent();
      }
    }
  }

  open() {
    this.isOpen.set(true);
    this.searchQuery.set('');
    this.searchResults.set({ workspaces: [], tasks: [] });
    this.selectedIndex.set(-1);

    // Focus input after a short delay
    setTimeout(() => {
      const input = document.querySelector('[role="combobox"]') as HTMLInputElement;
      input?.focus();
    }, 100);
  }

  close() {
    this.isOpen.set(false);
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  moveSelection(delta: number) {
    const total = this.totalResults();
    if (total === 0) return;

    const currentIndex = this.selectedIndex();

    // If nothing is selected and we're moving down, select first item
    if (currentIndex === -1 && delta > 0) {
      this.selectedIndex.set(0);
      return;
    }

    // If nothing is selected and we're moving up, select last item
    if (currentIndex === -1 && delta < 0) {
      this.selectedIndex.set(total - 1);
      return;
    }

    const newIndex = (currentIndex + delta + total) % total;
    this.selectedIndex.set(newIndex);
  }

  selectCurrent() {
    const currentIndex = this.selectedIndex();
    if (currentIndex === -1) return; // Nothing selected

    const results = this.flatResults();
    const selected = results[currentIndex];

    if (selected) {
      this.navigateToResult(selected);
    }
  }

  selectResult(result: SearchResult) {
    // Just update the selection to show in the preview panel
    const results = this.flatResults();
    const index = results.findIndex(r => 
      r.type === result.type && 
      ((r.type === 'workspace' && (r.item as Workspace).id === (result.item as Workspace).id) ||
       (r.type === 'task' && (r.item as Task).id === (result.item as Task).id))
    );
    
    if (index !== -1) {
      this.selectedIndex.set(index);
    }
  }

  navigateToResult(result: SearchResult) {
    // Actually navigate to the page
    this.close();

    if (result.type === 'workspace') {
      const workspace = result.item as Workspace;
      this.router.navigate(['/workspaces', workspace.id]);
    } else {
      const task = result.item as Task;
      this.router.navigate(['/tasks', task.id]);
    }
  }

  getResultIndex(type: 'workspace' | 'task', index: number): number {
    const results = this.searchResults();
    if (type === 'workspace') {
      return index;
    } else {
      return results.workspaces.length + index;
    }
  }

  isSelected(type: 'workspace' | 'task', index: number): boolean {
    return this.getResultIndex(type, index) === this.selectedIndex();
  }

  getSelectedWorkspace(): Workspace | null {
    const selected = this.selectedItem();
    if (selected && selected.type === 'workspace') {
      return selected.item as Workspace;
    }
    return null;
  }

  getSelectedTask(): Task | null {
    const selected = this.selectedItem();
    if (selected && selected.type === 'task') {
      return selected.item as Task;
    }
    return null;
  }

  getWorkspaceOwnerName(): string {
    const workspace = this.getSelectedWorkspace();
    if (!workspace) return 'Unknown';
    
    const owner = workspace.members.find(m => m.role === 'admin');
    if (!owner) return 'Unknown';
    
    const user = this.userService.getCachedUsers().find(u => u.id === owner.userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  }

  getMemberInitials(userId: string): string {
    const user = this.userService.getCachedUsers().find(u => u.id === userId);
    if (!user) return '?';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getTaskStatusClasses(): string {
    const task = this.getSelectedTask();
    if (!task) return '';
    
    switch (task.status) {
      case 'todo':
        return 'inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700';
      case 'in-progress':
        return 'inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700';
      case 'done':
        return 'inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700';
      default:
        return '';
    }
  }

  getAssigneeName(): string {
    const task = this.getSelectedTask();
    if (!task || !task.assigneeId) return 'Unassigned';
    
    const user = this.userService.getCachedUsers().find(u => u.id === task.assigneeId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  }

  getTeamName(): string {
    const task = this.getSelectedTask();
    if (!task || !task.teamId) return 'No team';
    
    const teams = this.teamService.getCachedTeams();
    const team = teams.find(t => t.teamId === task.teamId);
    return team ? team.name : 'Unknown team';
  }

  isOverdue(): boolean {
    const task = this.getSelectedTask();
    if (!task || !task.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dueDate < today && task.status !== 'done';
  }

  ngOnDestroy() {
    this.searchSubscription.unsubscribe();
  }
}
