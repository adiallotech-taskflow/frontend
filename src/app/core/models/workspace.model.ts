export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface WorkspaceStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalMembers: number;
}