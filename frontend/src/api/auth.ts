import api from "./axios";
import type {
  UserCreate,
  UserLogin,
  UserResponse,
  LoginResponse,
} from "../types/auth";

export const registerUser = async (
  data: UserCreate
): Promise<UserResponse> => {
  const response = await api.post<UserResponse>("/auth/register", data);
  return response.data;
};

export const loginUser = async (
  data: UserLogin
): Promise<LoginResponse> => {
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

export const promoteToAdmin = async (
  userId: number
): Promise<UserResponse> => {
  const response = await api.put<UserResponse>(`/auth/promote/${userId}`);
  return response.data;
};

export const deactivateUser = async (
  userId: number
): Promise<UserResponse> => {
  const response = await api.delete<UserResponse>(`/auth/users/${userId}`);
  return response.data;
};

export const reactivateUser = async (
  userId: number
): Promise<UserResponse> => {
  const response = await api.patch<UserResponse>(
    `/auth/users/${userId}/activate`
  );
  return response.data;
};