import api from "./axios";
import type {
  UserCreate,
  UserLogin,
  UserResponse,
  LoginResponse,
  PasswordResetRequestResponse,
} from "../types/auth";

export const registerUser = async (
  data: UserCreate,
  image: File
): Promise<UserResponse> => {
  const formData = new FormData();
  formData.append("first_name", data.first_name);
  formData.append("last_name", data.last_name);
  formData.append("email", data.email);
  formData.append("password", data.password);
  formData.append("image", image);
  const response = await api.post<UserResponse>("/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const loginUser = async (data: UserLogin): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", data);
  return response.data;
};

export const getMyProfile = async (): Promise<UserResponse> => {
  const response = await api.get<UserResponse>("/auth/me");
  return response.data;
};

export const listUsers = async (): Promise<UserResponse[]> => {
  const response = await api.get<UserResponse[]>("/auth/users");
  return response.data;
};

export const getPendingUsers = async (): Promise<UserResponse[]> => {
  const response = await api.get<UserResponse[]>("/auth/users/pending");
  return response.data;
};

export const approveUser = async (userId: number): Promise<UserResponse> => {
  const response = await api.patch<UserResponse>(`/auth/users/${userId}/approve`);
  return response.data;
};

export const rejectUser = async (userId: number): Promise<void> => {
  await api.delete(`/auth/users/${userId}/reject`);
};

export const promoteToAdmin = async (userId: number): Promise<UserResponse> => {
  const response = await api.put<UserResponse>(`/auth/promote/${userId}`);
  return response.data;
};

export const deactivateUser = async (userId: number): Promise<UserResponse> => {
  const response = await api.delete<UserResponse>(`/auth/users/${userId}`);
  return response.data;
};

export const reactivateUser = async (userId: number): Promise<UserResponse> => {
  const response = await api.patch<UserResponse>(`/auth/users/${userId}/activate`);
  return response.data;
};

export const uploadProfileImage = async (file: File): Promise<UserResponse> => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post<UserResponse>("/auth/me/profile-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const requestPasswordReset = async (
  email: string
): Promise<PasswordResetRequestResponse> => {
  const response = await api.post<PasswordResetRequestResponse>(
    "/auth/password-reset/request",
    { email }
  );
  return response.data;
};

export const confirmPasswordReset = async (
  token: string,
  password: string
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    "/auth/password-reset/confirm",
    { token, password }
  );
  return response.data;
};