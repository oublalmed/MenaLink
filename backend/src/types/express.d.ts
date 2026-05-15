import { UserRole, UserStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      userId: string;
      firebaseUid: string;
      userRole: UserRole;
      userStatus: UserStatus;
    }
  }
}

export {};
