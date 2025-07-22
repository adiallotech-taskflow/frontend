import { Routes } from '@angular/router';

export const kanbanRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/kanban-board/kanban-board').then((c) => c.KanbanBoardComponent),
  },
];