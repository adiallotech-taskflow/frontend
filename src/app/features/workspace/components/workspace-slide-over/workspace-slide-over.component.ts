import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Workspace } from '../../../../core/models';
import { WorkspaceService } from '../../../../core/services';

@Component({
  selector: 'app-workspace-slide-over',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './workspace-slide-over.component.html',
  styleUrl: './workspace-slide-over.component.css',
})
export class WorkspaceSlideOverComponent {
  isOpen = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);
  form: FormGroup;
  mode = signal<'create' | 'edit'>('create');
  workspaceToEdit = signal<Workspace | null>(null);

  workspaceCreated = output<Workspace>();
  workspaceUpdated = output<Workspace>();
  closed = output<void>();

  constructor(
    private fb: FormBuilder,
    private workspaceService: WorkspaceService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
    });
  }

  open(workspace?: Workspace) {
    this.isOpen.set(true);
    this.error.set(null);
    
    if (workspace) {
      this.mode.set('edit');
      this.workspaceToEdit.set(workspace);
      this.form.patchValue({
        name: workspace.name,
        description: workspace.description || ''
      });
    } else {
      this.mode.set('create');
      this.workspaceToEdit.set(null);
      this.form.reset();
    }
  }

  close() {
    this.isOpen.set(false);
    this.closed.emit();
  }

  onSubmit() {
    if (this.form.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.error.set(null);

      const workspaceData = {
        name: this.form.value.name.trim(),
        description: this.form.value.description?.trim() || undefined,
      };

      if (this.mode() === 'edit' && this.workspaceToEdit()) {
        this.workspaceService.update(this.workspaceToEdit()!.id, workspaceData).subscribe({
          next: (workspace: Workspace) => {
            this.isLoading.set(false);
            this.workspaceUpdated.emit(workspace);
            this.close();
          },
          error: (error) => {
            this.isLoading.set(false);
            this.error.set(error.message || 'An error occurred while updating the workspace');
          },
        });
      } else {
        this.workspaceService.create(workspaceData).subscribe({
          next: (workspace: Workspace) => {
            this.isLoading.set(false);
            this.workspaceCreated.emit(workspace);
            this.close();
          },
          error: (error) => {
            this.isLoading.set(false);
            this.error.set(error.message || 'An error occurred while creating the workspace');
          },
        });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  get nameControl() {
    return this.form.get('name');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  get hasNameError() {
    const nameControl = this.nameControl;
    return nameControl?.invalid && nameControl?.touched;
  }

  get nameErrorMessage() {
    const nameControl = this.nameControl;
    if (nameControl?.hasError('required')) {
      return 'Name is required';
    }
    if (nameControl?.hasError('minlength')) {
      return 'Name must contain at least 3 characters';
    }
    return '';
  }

  clearError() {
    this.error.set(null);
  }
  
  get isEditMode() {
    return this.mode() === 'edit';
  }
  
  get dialogTitle() {
    return this.isEditMode ? 'Edit Workspace' : 'Create New Workspace';
  }
  
  get submitButtonText() {
    if (this.isLoading()) {
      return this.isEditMode ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode ? 'Update Workspace' : 'Create Workspace';
  }
}
