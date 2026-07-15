import type { User } from "@/types";
import { demoUser } from "@/lib/data";

const TOKEN_KEY = "smart-study-planner-token";

function saveToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export async function login(email: string, password: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!email || !password) throw new Error("Email dan password wajib diisi.");
  if (!email.includes("@")) throw new Error("Format email tidak valid.");
  if (password.length < 8) throw new Error("Password minimal 8 karakter.");

  const token = `mock-jwt-${Date.now()}`;
  saveToken(token);
  return { token, user: { ...demoUser, email } };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!input.name.trim()) throw new Error("Nama tidak boleh kosong.");
  if (!input.email.includes("@")) throw new Error("Email wajib valid.");
  if (input.password.length < 8) throw new Error("Password minimal 8 karakter.");

  const user: User = {
    id: `user_${Date.now()}`,
    name: input.name,
    email: input.email,
    isPremium: false
  };

  const token = `mock-jwt-${Date.now()}`;
  saveToken(token);
  return { token, user };
}

export function logout() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}
