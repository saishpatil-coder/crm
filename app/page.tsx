import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export default async function HomePage() {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let role: string | null = null;

  // 1. Only use try...catch for the actual JWT verification
  try {
    const { payload } = await jwtVerify(token, secret);
    role = payload.role as string;
  } catch (error) {
    // Token is invalid or expired
    redirect("/login?error=session_expired");
  }

  // 2. Do the redirects OUTSIDE the try...catch block
  if (role === "MASTER_ADMIN") {
    redirect("/admin"); // Or "/dashboard" based on your setup
  }

  if (role === "SUB_ADMIN") {
    redirect("/dashboard");
  }

  if (role === "WORKER") {
    redirect("/mobile");
  }

  // Fallback if role doesn't match anything
  redirect("/login?error=session_expired");
}
