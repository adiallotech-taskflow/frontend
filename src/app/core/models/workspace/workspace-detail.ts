import { WorkspaceMember } from './workspace.model';
import { User } from '../auth/user.model';

export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user?: User;
}
