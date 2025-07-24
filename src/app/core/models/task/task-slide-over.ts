import { Task } from './task.model';

export interface TaskSlideOverMode {
  type: 'create' | 'edit';
  task?: Task;
  workspaceId?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: Task['status'];
  priority: Task['priority'];
  assigneeId?: string;
  teamId?: string;
  dueDate?: string;
}
