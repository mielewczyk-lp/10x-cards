import { describe, it, expect } from "vitest";
import {
  LoginSchema,
  RegisterSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  getAuthErrorMessage,
} from "./authSchemas";

describe("LoginSchema", () => {
  it("accepts valid credentials", () => {
    const data = {
      email: "user@example.com",
      password: "password123",
    };

    const result = LoginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const data = {
      email: "invalid-email",
      password: "password123",
    };

    const result = LoginSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("EMAIL_INVALID");
    }
  });

  it("rejects empty password", () => {
    const data = {
      email: "user@example.com",
      password: "",
    };

    const result = LoginSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("PASSWORD_REQUIRED");
    }
  });
});

describe("RegisterSchema", () => {
  describe("password validation (CRITICAL: US-001)", () => {
    it("accepts password meeting all requirements (8+ chars, letter, number)", () => {
      const data = {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts password with uppercase and special characters", () => {
      const data = {
        email: "user@example.com",
        password: "Pass@word123!",
        confirmPassword: "Pass@word123!",
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts password exactly 8 characters long", () => {
      const data = {
        email: "user@example.com",
        password: "pass1234",
        confirmPassword: "pass1234",
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects password shorter than 8 characters", () => {
      const data = {
        email: "user@example.com",
        password: "pass12",
        confirmPassword: "pass12",
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("PASSWORD_TOO_SHORT");
      }
    });

    it("rejects password without letters", () => {
      const data = {
        email: "user@example.com",
        password: "12345678",
        confirmPassword: "12345678",
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("PASSWORD_MISSING_LETTER");
      }
    });

    it("rejects password without numbers", () => {
      const data = {
        email: "user@example.com",
        password: "password",
        confirmPassword: "password",
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("PASSWORD_MISSING_NUMBER");
      }
    });
  });

  describe("password confirmation validation", () => {
    it("accepts matching passwords", () => {
      const data = {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects non-matching passwords", () => {
      const data = {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password456",
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find((i) => i.path.includes("confirmPassword"));
        expect(confirmPasswordError?.message).toBe("PASSWORDS_DO_NOT_MATCH");
      }
    });

    it("rejects missing confirmPassword", () => {
      const data = {
        email: "user@example.com",
        password: "password123",
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("CONFIRM_PASSWORD_REQUIRED");
      }
    });
  });

  it("reports multiple validation errors together", () => {
    const data = {
      email: "invalid",
      password: "short",
      confirmPassword: "different",
    };

    const result = RegisterSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(1);
    }
  });
});

describe("ChangePasswordSchema", () => {
  it("accepts valid password change with all requirements", () => {
    const data = {
      currentPassword: "oldpass123",
      newPassword: "newpass123",
      confirmNewPassword: "newpass123",
    };

    const result = ChangePasswordSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects empty current password", () => {
    const data = {
      currentPassword: "",
      newPassword: "newpass123",
      confirmNewPassword: "newpass123",
    };

    const result = ChangePasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("CURRENT_PASSWORD_REQUIRED");
    }
  });

  it("enforces password requirements for new password", () => {
    const data = {
      currentPassword: "oldpass123",
      newPassword: "short",
      confirmNewPassword: "short",
    };

    const result = ChangePasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects non-matching new passwords", () => {
    const data = {
      currentPassword: "oldpass123",
      newPassword: "newpass123",
      confirmNewPassword: "different123",
    };

    const result = ChangePasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path.includes("confirmNewPassword"));
      expect(confirmError?.message).toBe("PASSWORDS_DO_NOT_MATCH");
    }
  });
});

describe("ForgotPasswordSchema", () => {
  it("accepts valid email address", () => {
    const data = {
      email: "user@example.com",
    };

    const result = ForgotPasswordSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const data = {
      email: "invalid-email",
    };

    const result = ForgotPasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("EMAIL_INVALID");
    }
  });

  it("rejects missing email", () => {
    const data = {};

    const result = ForgotPasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("EMAIL_REQUIRED");
    }
  });
});

describe("ResetPasswordSchema", () => {
  it("accepts valid password with confirmation", () => {
    const data = {
      password: "newpass123",
      confirmPassword: "newpass123",
    };

    const result = ResetPasswordSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("enforces password requirements (8+ chars, letter, number)", () => {
    const invalidPasswords = [
      { password: "short1", confirmPassword: "short1" }, // Too short
      { password: "12345678", confirmPassword: "12345678" }, // No letter
      { password: "password", confirmPassword: "password" }, // No number
    ];

    invalidPasswords.forEach((data) => {
      const result = ResetPasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  it("rejects non-matching passwords", () => {
    const data = {
      password: "newpass123",
      confirmPassword: "different123",
    };

    const result = ResetPasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path.includes("confirmPassword"));
      expect(confirmError?.message).toBe("PASSWORDS_DO_NOT_MATCH");
    }
  });
});

describe("getAuthErrorMessage", () => {
  it("returns correct message for password validation errors", () => {
    expect(getAuthErrorMessage("PASSWORD_TOO_SHORT")).toBe("Password must be at least 8 characters long");
    expect(getAuthErrorMessage("PASSWORD_MISSING_LETTER")).toBe("Password must contain at least one letter");
    expect(getAuthErrorMessage("PASSWORD_MISSING_NUMBER")).toBe("Password must contain at least one number");
  });

  it("returns correct message for authentication errors", () => {
    expect(getAuthErrorMessage("INVALID_CREDENTIALS")).toBe("Invalid email or password");
    expect(getAuthErrorMessage("PASSWORDS_DO_NOT_MATCH")).toBe("Passwords do not match");
  });

  it("returns default message for unknown error code", () => {
    const message = getAuthErrorMessage("UNKNOWN_ERROR_CODE");
    expect(message).toBe("An error occurred. Please try again");
  });
});
