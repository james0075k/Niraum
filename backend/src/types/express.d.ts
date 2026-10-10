import type { Role } from '../models/User.js';

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
  mustChangePassword: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
