import { AppError } from "../middleware/errorHandler";

interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  rejectCommonPasswords: boolean;
}

const COMMON_PASSWORDS = new Set([
  "password", "password123", "123456", "12345678", "qwerty",
  "admin", "letmein", "welcome", "monkey", "dragon",
  "master", "sunshine", "princess", "football", "iloveyou",
]);

const defaultPolicy: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  rejectCommonPasswords: true,
};

export const validatePassword = (
  password: string,
  policy: PasswordPolicy = defaultPolicy
): void => {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  if (policy.rejectCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push("Password is too common. Please choose a stronger password");
  }

  if (errors.length > 0) {
    throw new AppError(errors.join("; "), 400);
  }
};
