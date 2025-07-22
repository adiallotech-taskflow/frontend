import { Task } from './task.model';

export interface TaskFilters {
  status?: Task['status'];
  priority?: Task['priority'];
  assigneeId?: string;
  workspaceId?: string;
  search?: string;
  hasDueDate?: boolean;
  isOverdue?: boolean;
}
