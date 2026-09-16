import api from "./axios";
import type { ShiftResponse, ShiftSummaryResponse } from "../types/shift";

export const getActiveShift = async (): Promise<ShiftResponse> => {
  const response = await api.get<ShiftResponse>("/shifts/active");
  return response.data;
};

export const openShift = async (): Promise<ShiftResponse> => {
  const response = await api.post<ShiftResponse>("/shifts/open");
  return response.data;
};

export const closeShift = async (): Promise<ShiftSummaryResponse> => {
  const response = await api.patch<ShiftSummaryResponse>("/shifts/close");
  return response.data;
};

export const getMyShifts = async (): Promise<ShiftSummaryResponse[]> => {
  const response = await api.get<ShiftSummaryResponse[]>("/shifts/my");
  return response.data;
};

export const getAllShifts = async (): Promise<ShiftSummaryResponse[]> => {
  const response = await api.get<ShiftSummaryResponse[]>("/shifts/");
  return response.data;
};