import { Workspace } from './workspace/workspace.model'
import { Task } from './task/task.model';


export interface SearchResult {
  type: 'workspace' | 'task';
  item: Workspace | Task;
}
