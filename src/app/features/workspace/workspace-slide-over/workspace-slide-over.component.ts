import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Workspace } from '../../../core/models';

@Component({
  selector: 'app-workspace-slide-over',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './workspace-slide-over.component.html',
  styleUrl: './workspace-slide-over.component.css'
})
export class WorkspaceSlideOverComponent {
  isOpen = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);
  form: FormGroup;

  // Outputs
  workspaceCreated = output<Workspace>();
  closed = output<void>();

  constructor(
    private fb: FormBuilder,
    private workspaceService: WorkspaceService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  open() {
    this.isOpen.set(true);
    this.form.reset();
    this.error.set(null);
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
        description: this.form.value.description?.trim() || undefined
      };

      this.workspaceService.create(workspaceData).subscribe({
        next: (workspace: Workspace) => {
          this.isLoading.set(false);
          this.workspaceCreated.emit(workspace);
          this.close();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.error.set(error.message || 'Une erreur est survenue lors de la création du workspace');
        }
      });
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
      return 'Le nom est requis';
    }
    if (nameControl?.hasError('minlength')) {
      return 'Le nom doit contenir au moins 3 caractères';
    }
    return '';
  }

  clearError() {
    this.error.set(null);
  }
}