import { Component, signal, output, input, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Workspace, User, WorkspaceMember } from '../../../../core/models';
import { WorkspaceService, UserService } from '../../../../core/services';

interface UserWithRole {
  user: User;
  role: 'admin' | 'member' | 'viewer';
  selected: boolean;
}

@Component({
  selector: 'app-add-member-slide-over',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-member-slide-over.component.html',
  styleUrls: ['./add-member-slide-over.component.css'],
})
export class AddMemberSlideOverComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private userService = inject(UserService);

  workspace = input.required<Workspace>();

  isOpen = signal(false);
  isLoading = signal(false);
  loadingUsers = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');

  allUsers = signal<User[]>([]);
  availableUsers = signal<UserWithRole[]>([]);

  membersAdded = output<WorkspaceMember[]>();
  closed = output<void>();

  filteredUsers = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const users = this.availableUsers();

    if (!search) {
      return users;
    }

    return users.filter(({ user }) =>
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  });

  selectedCount = computed(() =>
    this.availableUsers().filter(u => u.selected).length
  );

  ngOnInit() {
    this.loadUsers();
  }

  open() {
    this.isOpen.set(true);
    this.error.set(null);
    this.searchTerm.set('');
    this.loadUsers();
  }

  close() {
    this.isOpen.set(false);
    this.closed.emit();
  }

  private loadUsers() {
    this.loadingUsers.set(true);

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.allUsers.set(users);
        this.updateAvailableUsers();
        this.loadingUsers.set(false);
      },
      error: () => {
        this.error.set('Failed to load users');
        this.loadingUsers.set(false);
      },
    });
  }

  private updateAvailableUsers() {
    const workspace = this.workspace();
    const allUsers = this.allUsers();
    const memberIds = workspace.members.map(m => m.userId);

    const available = allUsers
      .filter(user => !memberIds.includes(user.id))
      .map(user => ({
        user,
        role: 'member' as const,
        selected: false
      }));

    this.availableUsers.set(available);
  }

  toggleUserSelection(userId: string) {
    const users = this.availableUsers();
    const index = users.findIndex(u => u.user.id === userId);

    if (index !== -1) {
      const updated = [...users];
      updated[index] = {
        ...updated[index],
        selected: !updated[index].selected
      };
      this.availableUsers.set(updated);
    }
  }

  updateUserRole(userId: string, role: 'admin' | 'member' | 'viewer') {
    const users = this.availableUsers();
    const index = users.findIndex(u => u.user.id === userId);

    if (index !== -1) {
      const updated = [...users];
      updated[index] = {
        ...updated[index],
        role
      };
      this.availableUsers.set(updated);
    }
  }

  deselectAll() {
    const users = this.availableUsers().map(u => ({
      ...u,
      selected: false
    }));
    this.availableUsers.set(users);
  }

  async onSubmit() {
    const selectedUsers = this.availableUsers().filter(u => u.selected);

    if (selectedUsers.length === 0) {
      this.error.set('Please select at least one user');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const addedMembers: WorkspaceMember[] = [];

      for (const { user, role } of selectedUsers) {
        const member = await firstValueFrom(
          this.workspaceService.inviteMember(this.workspace().id, { email: user.email, role })
        );
        if (member) {
          addedMembers.push(member);
        }
      }

      this.membersAdded.emit(addedMembers);
      this.close();
    } catch (error) {
      this.error.set('Failed to add members. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  clearError() {
    this.error.set(null);
  }
}
