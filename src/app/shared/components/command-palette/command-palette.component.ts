import {Component, signal, computed, HostListener, inject, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, combineLatest, of } from 'rxjs';
import { WorkspaceService, TaskService } from '../../../core/services';
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

  isOpen = signal(false);
  searchQuery = signal('');
  isSearching = signal(false);
  searchResults = signal<{
    workspaces: Workspace[];
    tasks: Task[];
  }>({ workspaces: [], tasks: [] });
  selectedIndex = signal(0);

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
        this.workspaceService.search(query),
        this.taskService.search(query)
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

  navigateToResult(result: SearchResult) {
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

  ngOnDestroy() {
    this.searchSubscription.unsubscribe();
  }
}
