export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface RegisterResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface TokenRequest {
  token: string;
}