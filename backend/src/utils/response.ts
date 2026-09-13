import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const responseBody: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  };
  return res.status(statusCode).json(responseBody);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400
): Response => {
  const responseBody: ApiResponse = {
    success: false,
    error,
  };
  return res.status(statusCode).json(responseBody);
};
