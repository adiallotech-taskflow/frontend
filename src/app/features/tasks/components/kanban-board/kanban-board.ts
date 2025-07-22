import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDropListGroup, CdkDragPlaceholder, CdkDragPreview, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, TaskStatus, User } from '../../../../core/models';
import { TaskService } from '../../../../core/services';
import { TaskCardComponent } from '../../../../shared';
import { UserService } from '../../../../core/services';

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

@Component({
  selector: 'app-kanban-board',
  imports: [
    CommonModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDragPreview,
    TaskCardComponent
  ],
  templateUrl: './kanban-board.html',
  styleUrl: './kanban-board.css'
})
export class KanbanBoardComponent implements OnInit {
  private taskService = inject(TaskService);
  private userService = inject(UserService);

  tasks = signal<Task[]>([]);
  users = signal<User[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  columns: KanbanColumn[] = [
    {
      id: 'todo',
      title: 'Todo',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'in-progress',
      title: 'En cours',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'done',
      title: 'Terminé',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  todoTasks = computed(() => this.tasks().filter(t => t.status === 'todo'));
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'in-progress'));
  doneTasks = computed(() => this.tasks().filter(t => t.status === 'done'));

  getTasksByStatus(status: TaskStatus): Task[] {
    switch (status) {
      case 'todo':
        return this.todoTasks();
      case 'in-progress':
        return this.inProgressTasks();
      case 'done':
        return this.doneTasks();
      default:
        return [];
    }
  }

  getAssignedUser(assigneeId?: string): User | undefined {
    if (!assigneeId) return undefined;
    return this.users().find(u => u.id === assigneeId);
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const updatedTask = { ...task, status: newStatus };
      const currentTasks = this.tasks();
      const taskIndex = currentTasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        const newTasks = [...currentTasks];
        newTasks[taskIndex] = updatedTask;
        this.tasks.set(newTasks);
      }

      this.taskService.updateStatus(task.id, newStatus).subscribe({
        error: (err) => {
          console.error('Failed to update task status:', err);
          this.error.set('Erreur lors de la mise à jour du statut');

          const revertedTasks = [...this.tasks()];
          const revertIndex = revertedTasks.findIndex(t => t.id === task.id);
          if (revertIndex !== -1) {
            revertedTasks[revertIndex] = task;
            this.tasks.set(revertedTasks);
          }
        }
      });
    }
  }

  onTaskAction(event: { action: string; task: Task }) {
    console.log('Task action:', event);
  }

  getConnectedLists(currentColumnId: TaskStatus): string[] {
    return this.columns
      .filter(col => col.id !== currentColumnId)
      .map(col => col.id);
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.isLoading.set(true);
    this.error.set(null);

    Promise.all([
      this.taskService.list().toPromise(),
      this.userService.getUsers().toPromise()
    ])
    .then(([tasks, users]) => {
      if (tasks) this.tasks.set(tasks);
      if (users) this.users.set(users);
      this.isLoading.set(false);
    })
    .catch(err => {
      console.error('Error loading data:', err);
      this.error.set('Failed to load tasks');
      this.isLoading.set(false);
    });
  }
}