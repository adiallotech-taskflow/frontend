import { Task } from './task.model';

export interface TaskGroup {
  status: Task['status'];
  label: string;
  tasks: Task[];
  count: number;
  bgColor: string;
  textColor: string;
}
