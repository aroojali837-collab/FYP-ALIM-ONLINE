// Session management utilities

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: "customer" | "alim";
  city?: string;
  phoneNumber?: string;
  fiqh?: string;
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// Save user to localStorage
export function setCurrentUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
}

// Logout user
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("user");
}

// Check user role
export function isAlim(): boolean {
  const user = getCurrentUser();
  return user?.role === "alim";
}

export function isCustomer(): boolean {
  const user = getCurrentUser();
  return user?.role === "customer";
}
