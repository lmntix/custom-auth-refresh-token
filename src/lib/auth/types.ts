// lib/auth/types.ts
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type Session = {
  user: SessionUser;
  expiresAt: number;
  refreshToken?: string;
};
