export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}
