export interface TeamModel {
  teamId: string;
  name: string;
  description?: string;
  leaderId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt?: string;
}