// Shared validation helpers for Campus Music

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isEduEmail(email: string): boolean {
  return email.toLowerCase().endsWith(".edu");
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isValidUsername(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateLoginForm(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (!isValidPassword(password)) {
    errors.password = "Password must be at least 6 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSignupForm(
  email: string,
  password: string,
  fullName: string,
  universityName: string,
  role: string
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (!isValidPassword(password)) {
    errors.password = "Password must be at least 6 characters";
  }

  if (!fullName.trim()) {
    errors.fullName = "Full name is required";
  } else if (!isValidUsername(fullName)) {
    errors.fullName = "Full name must be between 2 and 100 characters";
  }

  if (!universityName.trim()) {
    errors.universityName = "University is required";
  }

  if (role === "artist" && !isEduEmail(email)) {
    errors.email = "Artist accounts require a .edu email address";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return past.toLocaleDateString();
  }
  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }
  if (diffMins > 0) {
    return `${diffMins}m ago`;
  }
  return "Just now";
}
