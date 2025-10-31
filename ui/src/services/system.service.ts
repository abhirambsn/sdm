import api from "./api";

export class SystemService {
  static async getSystemStatus() {
    const dataResponse = await api.get("/system/status");
    return dataResponse.data;
  }
}