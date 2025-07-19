import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-detail',
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Task Detail</h1>
      <p class="text-gray-500">Task detail will be implemented here.</p>
    </div>
  `
})
export class TaskDetailComponent {}