import { Component, signal, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TeamModel, User } from '../../../../core/models';
import { TeamService, UserService, AuthService } from '../../../../core/services';

@Component({
  selector: 'app-team-slide-over',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './team-slide-over.component.html',
  styleUrl: './team-slide-over.component.css',
})
export class TeamSlideOverComponent implements OnInit {
  private fb = inject(FormBuilder);
  private teamService = inject(TeamService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  isOpen = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);
  form: FormGroup;

  allUsers = signal<User[]>([]);
  loadingUsers = signal(false);

  teamCreated = output<TeamModel>();
  closed = output<void>();

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      memberIds: [[]],
    });
  }

  ngOnInit() {
    this.loadAllUsers();
  }

  loadAllUsers() {
    this.loadingUsers.set(true);
    
    this.userService.getUsers().subscribe({
      next: (users) => {
        // Filter out current user as they will be automatically added as leader
        const currentUser = this.authService.getCurrentUser();
        const filteredUsers = users.filter(user => user.id !== currentUser?.id);
        
        this.allUsers.set(filteredUsers);
        this.loadingUsers.set(false);
      },
      error: () => {
        this.error.set('Failed to load users');
        this.loadingUsers.set(false);
      },
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

      const { name, description } = this.form.value;

      this.teamService.create(name.trim(), description?.trim()).subscribe({
        next: (team: TeamModel) => {
          // Add selected members if any
          const selectedMemberIds = this.form.value.memberIds || [];
          
          if (selectedMemberIds.length > 0) {
            // Add each selected member
            const addMemberRequests = selectedMemberIds.map((userId: string) =>
              this.teamService.addMember(team.teamId, userId).toPromise()
            );

            Promise.all(addMemberRequests).then(() => {
              this.isLoading.set(false);
              this.teamCreated.emit(team);
              this.close();
            }).catch(() => {
              // Team created but some members couldn't be added
              this.isLoading.set(false);
              this.teamCreated.emit(team);
              this.close();
            });
          } else {
            this.isLoading.set(false);
            this.teamCreated.emit(team);
            this.close();
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.error.set(error.message || 'An error occurred while creating the team');
        },
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  isUserSelected(userId: string): boolean {
    const selectedIds = this.form.get('memberIds')?.value || [];
    return selectedIds.includes(userId);
  }

  toggleUserSelection(userId: string) {
    const currentIds = this.form.get('memberIds')?.value || [];
    const index = currentIds.indexOf(userId);
    
    if (index > -1) {
      currentIds.splice(index, 1);
    } else {
      currentIds.push(userId);
    }
    
    this.form.get('memberIds')?.setValue([...currentIds]);
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
      return 'Team name is required';
    }
    if (nameControl?.hasError('minlength')) {
      return 'Team name must contain at least 3 characters';
    }
    return '';
  }

  clearError() {
    this.error.set(null);
  }
}