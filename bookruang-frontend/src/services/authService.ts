import axios from 'axios';

const API_URL = 'http://localhost:5021/api/auth/';

export interface LoginResponse {
  token: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

const register = async (data: RegisterData): Promise<void> => {
  const response = await axios.post(API_URL + 'register', data);
  return response.data;
};

const login = async (data: { email: string; password: string }): Promise<LoginResponse> => {
  const response = await axios.post(API_URL + 'login', {
    usernameOrEmail: data.email,
    password: data.password,
  });
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const logout = (): void => {
  localStorage.removeItem('user');
};

const getCurrentUser = (): LoginResponse | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const getAuthHeader = (): Record<string, string> => {
  const user = getCurrentUser();
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const isAdmin = (): boolean => {
  return getCurrentUser()?.role === 'Admin';
};

export default { register, login, logout, getCurrentUser, getAuthHeader, isAdmin };
