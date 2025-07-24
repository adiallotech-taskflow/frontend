import { Component, input, output, ViewChild, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Workspace, WorkspaceMemberWithUser, User, WorkspaceMember } from '../../../../core/models';
import { AddMemberSlideOverComponent } from '../add-member-slide-over/add-member-slide-over.component';
import { WorkspaceService, AuthService, NotificationService } from '../../../../core/services';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-workspace-members',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, AddMemberSlideOverComponent, ConfirmationDialogComponent],
  templateUrl: './workspace-members.component.html',
  styleUrls: ['./workspace-members.component.css'],
})
export class WorkspaceMembersComponent {
  @ViewChild(AddMemberSlideOverComponent) addMemberSlideOver!: AddMemberSlideOverComponent;
  @ViewChild('removeConfirmDialog') removeConfirmDialog!: ConfirmationDialogComponent;
  
  private workspaceService = inject(WorkspaceService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  
  workspace = input.required<Workspace>();
  membersWithUsers = input.required<WorkspaceMemberWithUser[]>();
  canEdit = input<boolean>(false);
  
  membersAdded = output<WorkspaceMember[]>();
  memberRemoved = output<string>();
  memberRoleChanged = output<{ userId: string; role: 'admin' | 'member' | 'viewer' }>();
  
  memberToRemove: WorkspaceMemberWithUser | null = null;
  
  getUserInitial(user?: User | null): string {
    if (!user || !user.firstName) {
      return 'U';
    }
    return user.firstName.charAt(0).toUpperCase();
  }

  getUserFullName(user?: User | null): string {
    if (!user) {
      return 'Unknown User';
    }
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown User';
  }
  
  openAddMemberSlideOver() {
    this.addMemberSlideOver?.open();
  }
  
  onMembersAdded(members: WorkspaceMember[]) {
    this.membersAdded.emit(members);
  }
  
  currentUserId(): string | undefined {
    return this.authService.getCurrentUser()?.id;
  }
  
  removeMember(member: WorkspaceMemberWithUser) {
    this.memberToRemove = member;
    this.removeConfirmDialog?.open();
  }
  
  confirmRemoveMember() {
    if (!this.memberToRemove) return;
    
    const memberName = this.getUserFullName(this.memberToRemove.user);
    
    this.workspaceService
      .removeMember(this.workspace().id, this.memberToRemove.userId)
      .subscribe({
        next: () => {
          this.memberRemoved.emit(this.memberToRemove!.userId);
          this.notificationService.success(
            'Member removed',
            `${memberName} has been removed from the workspace`
          );
          this.memberToRemove = null;
        },
        error: (error) => {
          console.error('Error removing member:', error);
          this.notificationService.error(
            'Failed to remove member',
            'An error occurred while removing the member. Please try again.'
          );
        }
      });
  }
  
  onRoleChange(userId: string, newRole: 'admin' | 'member' | 'viewer') {
    const member = this.membersWithUsers().find(m => m.userId === userId);
    const memberName = member ? this.getUserFullName(member.user) : 'Member';
    
    this.workspaceService
      .updateMemberRole(this.workspace().id, userId, newRole)
      .subscribe({
        next: () => {
          this.memberRoleChanged.emit({ userId, role: newRole });
          this.notificationService.success(
            'Role updated',
            `${memberName}'s role has been changed to ${newRole}`
          );
        },
        error: (error) => {
          console.error('Error updating member role:', error);
          this.notificationService.error(
            'Failed to update role',
            'An error occurred while updating the member role. Please try again.'
          );
        }
      });
  }
}