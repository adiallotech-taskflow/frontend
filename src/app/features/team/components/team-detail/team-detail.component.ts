import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeamService, UserService, AuthService, NotificationService } from '../../../../core/services';
import { TeamModel, User, ConfirmationDialogData } from '../../../../core/models';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { AddMemberSlideOverComponent } from '../add-member-slide-over/add-member-slide-over.component';
import { EditTeamSlideOverComponent } from '../edit-team-slide-over/edit-team-slide-over.component';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmationDialogComponent, AddMemberSlideOverComponent, EditTeamSlideOverComponent],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.css',
})
export class TeamDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teamService = inject(TeamService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  team = signal<TeamModel | null>(null);
  allUsers = signal<User[]>([]);
  availableUsers = signal<User[]>([]);
  teamMembers = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  isAddingMember = signal(false);

  confirmationData: ConfirmationDialogData = {
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  };

  @ViewChild('confirmationDialog') confirmationDialog!: ConfirmationDialogComponent;
  @ViewChild('addMemberSlideOver') addMemberSlideOver!: AddMemberSlideOverComponent;
  @ViewChild('editTeamSlideOver') editTeamSlideOver!: EditTeamSlideOverComponent;

  memberToRemove: User | null = null;
  teamIdToDelete: string | null = null;

  ngOnInit() {
    const teamId = this.route.snapshot.paramMap.get('id');
    if (teamId) {
      this.loadTeamDetails(teamId);
    } else {
      this.router.navigate(['/teams']);
    }
  }

  loadTeamDetails(teamId: string) {
    this.loading.set(true);
    this.error.set(null);

    // Load users first
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.allUsers.set(users);

        // Then load team details
        this.teamService.getTeamById(teamId).subscribe({
          next: (team) => {
            this.team.set(team);
            this.updateMemberLists(team, users);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Failed to load team details');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('Failed to load users');
        this.loading.set(false);
      },
    });
  }

  updateMemberLists(team: TeamModel, allUsers: User[]) {
    const members = allUsers.filter(user => team.memberIds.includes(user.id));
    const available = allUsers.filter(user => !team.memberIds.includes(user.id));

    this.teamMembers.set(members);
    this.availableUsers.set(available);
  }

  isCurrentUserLeader(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const team = this.team();
    return currentUser ? team?.leaderId === currentUser.id : false;
  }

  canManageMembers(): boolean {
    return this.isCurrentUserLeader();
  }

  openAddMemberModal() {
    this.addMemberSlideOver.open();
  }

  openEditTeamModal() {
    this.editTeamSlideOver.open();
  }

  onTeamUpdated(updates: { name: string; description?: string }) {
    const team = this.team();
    if (!team) return;

    this.teamService.updateTeam(team.teamId, updates).subscribe({
      next: (updatedTeam) => {
        this.team.set(updatedTeam);
        this.notificationService.success('Team updated', 'Team information has been updated successfully');
      },
      error: (error) => {
        this.notificationService.error('Failed to update team', error.message || 'Please try again');
      },
    });
  }

  onMembersAdded(userIds: string[]) {
    const team = this.team();
    if (!team || userIds.length === 0) return;

    this.isAddingMember.set(true);

    // Add members one by one
    let completedCount = 0;
    let errorCount = 0;

    userIds.forEach(userId => {
      this.teamService.addMember(team.teamId, userId).subscribe({
        next: (updatedTeam) => {
          completedCount++;
          this.team.set(updatedTeam);
          this.updateMemberLists(updatedTeam, this.allUsers());

          // Check if all members have been processed
          if (completedCount + errorCount === userIds.length) {
            this.isAddingMember.set(false);
            if (errorCount === 0) {
              const message = userIds.length === 1
                ? 'New member has been added to the team'
                : `${userIds.length} new members have been added to the team`;
              this.notificationService.success('Members added', message);
            } else {
              this.notificationService.warning(
                'Partial success',
                `${completedCount} members added, ${errorCount} failed`
              );
            }
          }
        },
        error: (error) => {
          errorCount++;

          // Check if all members have been processed
          if (completedCount + errorCount === userIds.length) {
            this.isAddingMember.set(false);
            if (completedCount === 0) {
              this.notificationService.error('Failed to add members', error.message || 'Please try again');
            } else {
              this.notificationService.warning(
                'Partial success',
                `${completedCount} members added, ${errorCount} failed`
              );
            }
          }
        },
      });
    });
  }

  confirmRemoveMember(member: User) {
    this.confirmationData = {
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${this.getUserDisplayName(member)} from the team?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'warning',
    };

    this.memberToRemove = member;
    this.confirmationDialog.open();
  }

  onRemoveMemberConfirmed() {
    const team = this.team();
    if (!this.memberToRemove || !team) return;

    this.teamService.removeMember(team.teamId, this.memberToRemove.id).subscribe({
      next: (updatedTeam) => {
        this.team.set(updatedTeam);
        this.updateMemberLists(updatedTeam, this.allUsers());
        this.notificationService.success('Member removed', 'Member has been removed from the team');
        this.memberToRemove = null;
      },
      error: (error) => {
        this.notificationService.error('Failed to remove member', error.message || 'Please try again');
        this.memberToRemove = null;
      },
    });
  }

  onRemoveMemberCancelled() {
    this.memberToRemove = null;
  }

  confirmDeleteTeam() {
    const team = this.team();
    if (!team) return;

    this.confirmationData = {
      title: 'Delete Team',
      message: `Are you sure you want to delete "${team.name}"? This action cannot be undone.`,
      confirmText: 'Delete Team',
      cancelText: 'Cancel',
      type: 'danger',
    };

    this.teamIdToDelete = team.teamId;
    this.confirmationDialog.open();
  }

  onDeleteTeamConfirmed() {
    if (!this.teamIdToDelete) return;

    this.teamService.deleteTeam(this.teamIdToDelete).subscribe({
      next: () => {
        this.notificationService.success('Team deleted', 'The team has been permanently deleted');
        this.router.navigate(['/teams']);
      },
      error: (error) => {
        this.notificationService.error('Failed to delete team', error.message || 'Please try again');
        this.teamIdToDelete = null;
      },
    });
  }

  onDeleteTeamCancelled() {
    this.teamIdToDelete = null;
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
