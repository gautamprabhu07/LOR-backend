import apiClient from "./apiClient";

export type UserRole = "student" | "faculty" | "admin";

export interface AuthUser {
  userId: string;
  role: UserRole;
}

interface LoginResponse {
  status: "success";
  data: AuthUser & { accessToken?: string };
}

type MeResponse = LoginResponse;

export const authApi = {
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await apiClient.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    const { accessToken, ...user } = res.data.data;
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }
    return user;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
    localStorage.removeItem("accessToken");
  },

  async me(): Promise<AuthUser | null> {
    try {
      const res = await apiClient.get<MeResponse>("/auth/me");
      return res.data.data;
    } catch (err: unknown) {
      // 401 → not authenticated
      const statusCode =
        typeof err === "object" && err !== null && "statusCode" in err
          ? (err as { statusCode?: number }).statusCode
          : undefined;
      if (statusCode === 401) return null;
      throw err as Error;
    }
  },
};
