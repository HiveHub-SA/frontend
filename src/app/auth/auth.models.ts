// ─── Request DTOs ────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

export interface LoginResponse {
  email: string;
}

export interface CreateUserResponse {
  id: number;
  email: string;
}
