import { Routes } from '@angular/router';

export const tasksRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/task-list/task-list.component').then(c => c.TaskListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/task-detail/task-detail.component').then(c => c.TaskDetailComponent)
  }
];