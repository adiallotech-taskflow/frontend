import { TaskStatus } from '../task/task.model';

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}
