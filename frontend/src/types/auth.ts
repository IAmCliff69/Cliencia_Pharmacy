// Mirrors app/auth/schemas.py

export interface UserCreate {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserResponse {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "staff" | "admin";
  is_active: boolean;
  profile_image_url?: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface PasswordResetRequestResponse {
  message: string;
  reset_token?: string;
}