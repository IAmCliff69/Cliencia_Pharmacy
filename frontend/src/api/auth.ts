import api from "./axios";
import type {
  UserCreate,
  UserLogin,
  UserResponse,
  LoginResponse,
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

export const uploadProfileImage = async (file: File): Promise<UserResponse> => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post<UserResponse>("/auth/me/profile-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};