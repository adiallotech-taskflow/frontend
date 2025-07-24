import { Task } from './task.model';

export interface TaskFilterOptions {
  myTasks: boolean;
  status: Task['status'][];
  priority: Task['priority'][];
  thisWeek: boolean;
  overdue: boolean;
  teamIds: string[];
}

export interface FilterOption {
  value: string;
  label: string;
  active: boolean;
}
