import { WorkspaceMember } from './workspace.model';
import {User} from './user.model';

export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user?: User;
}
