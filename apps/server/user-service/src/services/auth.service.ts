import type {
  ServiceResult,
  SignInInput,
  SignInResult,
  SignOutResult,
  SignUpInput,
  SignUpResult,
  VerifyOTPResult,
} from "@orra/types";
import { auth } from "../lib/auth";

function getCookies(response: Response): string[] {
  return response.headers.getSetCookie();
}

export const AuthService = {
  async signUp(input: SignUpInput): Promise<ServiceResult<SignUpResult>> {
    try {
      const response = await auth.api.signUpEmail({
        body: input,
        asResponse: true,
      });
      if (!response.ok) {
        return { success: false, error: "Sign up failed", code: "BAD_REQUEST" };
      }
      return { success: true, data: { cookies: getCookies(response) } };
    } catch (err) {
      console.error("[AuthService.signUp]", err);
      return {
        success: false,
        error: "Failed to sign up",
        code: "BAD_REQUEST",
      };
    }
  },

  async signIn(input: SignInInput): Promise<ServiceResult<SignInResult>> {
    try {
      const response = await auth.api.signInEmail({
        body: input,
        asResponse: true,
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Invalid email or password",
          code: "UNAUTHORIZED",
        };
      }

      const raw = (await response.json()) as Record<string, unknown>;
      const user = (raw.user ?? {}) as Record<string, unknown>;

      return {
        success: true,
        data: {
          user,
          cookies: getCookies(response),
        },
      };
    } catch (err) {
      console.error("[AuthService.signIn]", err);
      return {
        success: false,
        error: "Something went wrong. Please try again.",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async signOut(headers: Headers): Promise<ServiceResult<SignOutResult>> {
    try {
      const response = await auth.api.signOut({ headers, asResponse: true });
      return { success: true, data: { cookies: getCookies(response) } };
    } catch (err) {
      console.error("[AuthService.signOut]", err);
      return {
        success: false,
        error: "Failed to sign out",
        code: "BAD_REQUEST",
      };
    }
  },

  async forgotPassword(email: string): Promise<ServiceResult<void>> {
    try {
      await auth.api.sendVerificationOTP({
        body: { email, type: "forget-password" },
      });
    } catch (err) {
      console.error("[AuthService.forgotPassword]", err);
    }
    return { success: true, data: undefined };
  },

  async resetPassword(
    email: string,
    otp: string,
    password: string,
  ): Promise<ServiceResult<void>> {
    try {
      await auth.api.resetPasswordEmailOTP({
        body: { email, otp, password },
      });
      return { success: true, data: undefined };
    } catch (err) {
      console.error("[AuthService.resetPassword]", err);
      return {
        success: false,
        error: "Something went wrong. Please try again.",
        code: "INTERNAL_SERVER_ERROR",
      };
    }

  },

  async sendVerificationOTP(
    email: string,
    type: "sign-in" | "email-verification" | "forget-password",
  ): Promise<ServiceResult<void>> {
    try {
      await auth.api.sendVerificationOTP({
        body: { email, type },
      });
      return { success: true, data: undefined };
    } catch (err) {
      console.error("[AuthService.sendVerificationOTP]", err);
      return {
        success: false,
        error: "Something went wrong. Please try again.",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async verifyEmailOTP(
    email: string,
    otp: string,
  ): Promise<ServiceResult<void>> {
    try {
      await auth.api.verifyEmailOTP({
        body: { email, otp },
      });
      return { success: true, data: undefined };
    } catch (err) {
      console.error("[AuthService.verifyEmailOTP]", err);
      return {
        success: false,
        error: "Something went wrong. Please try again.",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async signInWithOTP(
    email: string,
    otp: string,
  ): Promise<ServiceResult<VerifyOTPResult>> {
    try {
      const response = await auth.api.signInEmailOTP({
        body: { email, otp },
        asResponse: true,
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Invalid or expired code",
          code: "BAD_REQUEST",
        };
      }

      const raw = (await response.json()) as Record<string, unknown>;
      const user = (raw.user ?? {}) as Record<string, unknown>;

      return {
        success: true,
        data: {
          user,
          cookies: getCookies(response),
        },
      };
    } catch (err) {
      console.error("[AuthService.signInWithOTP]", err);
      return {
        success: false,
        error: "Something went wrong. Please try again.",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async signInWithSocial(
    provider: "google" | "apple" | string,
    idToken: { token: string; accessToken?: string },
  ): Promise<ServiceResult<SignInResult>> {
    try {
      const response = await auth.api.signInSocial({
        body: { provider, idToken },
        asResponse: true,
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Social sign in failed",
          code: "UNAUTHORIZED",
        };
      }

      const raw = (await response.json()) as Record<string, unknown>;
      const user = (raw.user ?? {}) as Record<string, unknown>;

      return {
        success: true,
        data: {
          user,
          cookies: getCookies(response),
        },
      };
    } catch (err) {
      console.error("[AuthService.signInWithSocial]", err);
      return {
        success: false,
        error: "Something went wrong. Please try again.",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async getSocialSignInUrl(
    provider: "google" | "github" | string,
    callbackURL: string,
  ): Promise<ServiceResult<{ url: string }> & { cookies?: string[] }> {
    try {
      const response = await auth.api.signInSocial({
        body: { provider, callbackURL },
        asResponse: true,
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Failed to generate sign in URL",
          code: "BAD_REQUEST",
        };
      }

      const result = (await response.json()) as { url?: string };
      if (!result.url) {
        return {
          success: false,
          error: "Failed to generate sign in URL",
          code: "BAD_REQUEST",
        };
      }

      return {
        success: true,
        data: { url: result.url },
        cookies: getCookies(response),
      };
    } catch (err) {
      console.error("[AuthService.getSocialSignInUrl]", err);
      return {
        success: false,
        error: "Failed to generate sign in URL",
        code: "BAD_REQUEST",
      };
    }
  },
};
