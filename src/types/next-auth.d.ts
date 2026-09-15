import type { UserStatus } from '@/generated/prisma';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isSuperAdmin: boolean;
      isInternal: boolean;
      status: UserStatus;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
