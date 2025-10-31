import api from "./api";

export interface LoginReq { username: string; password: string; }
export interface LoginRes { token: string; }

export class AuthService {
  static async login(data: LoginReq): Promise<LoginRes> {
    const response = await api.post<LoginRes>("/auth/token", data);
    return response.data;
  }
}