import { Component, signal, output, input, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskMockService } from '../../../../core/services';
import { Task, User } from '../../../../core/models';

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
  dueDate?: string;
}

@Component({
  selector: 'app-task-slide-over',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-slide-over.component.html',
  styleUrl: './task-slide-over.component.css'
})
export class TaskSlideOverComponent implements OnInit {
  isOpen = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);
  form: FormGroup;

  mode = input<TaskSlideOverMode>({ type: 'create' });
  users = input<User[]>([]);

  taskCreated = output<Task>();
  taskUpdated = output<Task>();
  closed = output<void>();

  readonly statusOptions = [
    { value: 'todo', label: 'To Do', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    { value: 'in-progress', label: 'In Progress', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    { value: 'done', label: 'Done', bgColor: 'bg-green-100', textColor: 'text-green-800' }
  ] as const;

  readonly priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    { value: 'high', label: 'High', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
  ] as const;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskMockService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      status: ['todo', Validators.required],
      priority: ['medium', Validators.required],
      assigneeId: [''],
      dueDate: ['']
    });
  }

  ngOnInit() {
    
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen()) {
      this.close();
    }
  }

  open() {
    this.isOpen.set(true);
    this.error.set(null);

    setTimeout(() => {
      if (this.mode().type === 'create') {
        this.form.reset({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          assigneeId: '',
          dueDate: ''
        });
      } else if (this.mode().type === 'edit' && this.mode().task) {
        this.populateForm(this.mode().task!);
      }
    }, 0);
  }

  close() {
    this.isOpen.set(false);
    this.closed.emit();
  }


  onSubmit() {
    if (this.form.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.error.set(null);

      const formData = this.getFormData();

      if (this.mode().type === 'create') {
        this.createTask(formData);
      } else {
        this.updateTask(formData);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  private populateForm(task: Task) {
    const dueDate = task.dueDate ? this.formatDateForInput(task.dueDate) : '';

    this.form.patchValue({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      dueDate
    });
  }

  private getFormData(): TaskFormData {
    const formValue = this.form.value;
    return {
      title: formValue.title.trim(),
      description: formValue.description?.trim() || undefined,
      status: formValue.status,
      priority: formValue.priority,
      assigneeId: formValue.assigneeId || undefined,
      dueDate: formValue.dueDate || undefined
    };
  }

  private createTask(formData: TaskFormData) {
    const createData = {
      ...formData,
      workspaceId: this.mode().workspaceId!,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
    };

    this.taskService.createTask(createData).subscribe({
      next: (task: Task) => {
        this.isLoading.set(false);
        this.taskCreated.emit(task);
        this.close();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.error.set(error.message || 'An error occurred while creating the task');
      }
    });
  }

  private updateTask(formData: TaskFormData) {
    const taskId = this.mode().task!.id;
    const updateData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
    };

    this.taskService.updateTask(taskId, updateData).subscribe({
      next: (task: Task) => {
        this.isLoading.set(false);
        this.taskUpdated.emit(task);
        this.close();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.error.set(error.message || 'An error occurred while updating the task');
      }
    });
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get titleControl() {
    return this.form.get('title');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  get statusControl() {
    return this.form.get('status');
  }

  get priorityControl() {
    return this.form.get('priority');
  }

  get assigneeControl() {
    return this.form.get('assigneeId');
  }

  get dueDateControl() {
    return this.form.get('dueDate');
  }

  get hasTitleError() {
    const control = this.titleControl;
    return control?.invalid && control?.touched;
  }

  get titleErrorMessage() {
    const control = this.titleControl;
    if (control?.hasError('required')) {
      return 'Title is required';
    }
    if (control?.hasError('maxlength')) {
      return 'Title cannot exceed 100 characters';
    }
    return '';
  }

  get isEditMode() {
    return this.mode().type === 'edit';
  }

  get dialogTitle() {
    return this.isEditMode ? 'Edit Task' : 'Create New Task';
  }

  get submitButtonText() {
    if (this.isLoading()) {
      return this.isEditMode ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode ? 'Update Task' : 'Create Task';
  }

  clearError() {
    this.error.set(null);
  }

  getUserInitials(user: User): string {
    if (!user.firstName && !user.lastName) {
      return user.email.charAt(0).toUpperCase();
    }
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  getUserDisplayName(user: User): string {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  }
}