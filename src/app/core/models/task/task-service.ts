import { TaskPriority } from './task.model';

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  teamId?: string;
  dueDate?: Date;
}
