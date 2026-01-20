import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;
  const method = req.method;

  const hasSessionCookie = req.headers.get("cookie")?.includes("__session");

  console.log(
    "🔥 PROXY:",
    method,
    path,
    "userId:",
    userId,
    "cookie:",
    hasSessionCookie
  );

  // 🛡 Allow hydration race (important for dev stability)
  if (!userId && hasSessionCookie) {
    return NextResponse.next();
  }

  // 🔐 Block dashboard if NOT logged in
  if (method === "GET" && path.startsWith("/dashboard") && !userId) {
    console.log("⛔ BLOCKING dashboard for unauth user");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 🔒 Block home if logged in
  if (method === "GET" && path === "/" && userId) {
    console.log("🚀 REDIRECTING logged-in user to dashboard");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
