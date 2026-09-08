export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: unknown;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: UserProfile;
  tokens: TokenPair;
}
