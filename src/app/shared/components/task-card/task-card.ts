import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, User } from '../../../core/models';

export type TaskAction = 'edit' | 'delete';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css',
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() assignedUser?: User;
  @Output() taskAction = new EventEmitter<{ action: TaskAction; task: Task }>();

  get priorityConfig() {
    switch (this.task.priority) {
      case 'high':
        return { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-500' };
      case 'medium':
        return {
          color: 'yellow',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-500',
        };
      case 'low':
        return {
          color: 'green',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-500',
        };
      default:
        return { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800', borderColor: 'border-gray-500' };
    }
  }

  get statusConfig() {
    switch (this.task.status) {
      case 'todo':
        return {
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          ringColor: 'ring-gray-600/20',
          label: 'To Do',
        };
      case 'in-progress':
        return {
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          ringColor: 'ring-blue-600/20',
          label: 'In Progress',
        };
      case 'done':
        return {
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          ringColor: 'ring-green-600/20',
          label: 'Done',
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          ringColor: 'ring-gray-600/20',
          label: 'Unknown',
        };
    }
  }

  get userInitials(): string {
    if (!this.assignedUser) {
      return '?';
    }
    return `${this.assignedUser.firstName.charAt(0)}${this.assignedUser.lastName.charAt(0)}`.toUpperCase();
  }

  get userName(): string {
    if (!this.assignedUser) {
      return 'Unassigned';
    }
    return `${this.assignedUser.firstName} ${this.assignedUser.lastName}`;
  }

  get isOverdue(): boolean {
    if (!this.task.dueDate) {
      return false;
    }
    return new Date(this.task.dueDate) < new Date() && this.task.status !== 'done';
  }

  onCardClick() {
    this.taskAction.emit({ action: 'edit', task: this.task });
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();
    this.taskAction.emit({ action: 'delete', task: this.task });
  }
}
