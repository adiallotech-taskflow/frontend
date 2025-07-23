export interface TeamModel {
  teamId: string;
  name: string;
  workspaceId: string;
  leaderId: string;
  memberIds: string[];
  createdAt: string;
}