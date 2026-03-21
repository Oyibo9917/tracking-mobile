import axios from 'axios';
import { Platform } from 'react-native';

const DEFAULT_API_URL = Platform.OS === 'android'
  ? process.env.EXPO_PUBLIC_API_BASE_URL_ANDROID
  : process.env.EXPO_PUBLIC_API_BASE_URL_IOS;

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim() || DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = global.__authToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
