import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
console.log("Testing middleware")


export default clerkMiddleware( (auth, req) => {
  console.log("proxy hit....")


  const { userId } = auth;
  const path = req.nextUrl.pathname;
  const method = req.method;


const hasSessionCookie = req.headers.get("cookie")?.includes("__session");
console.log(hasSessionCookie , "hassession cookie.......")
  
console.log(userId , "USERID....testing in proxy")
console.log(method,path,hasSessionCookie)

if (hasSessionCookie && !auth.userId) {
 console.log("⏳ Allowing hydration pass");
 return NextResponse.next();
}

  // 🔐 Block dashboard if NOT logged in
  if (method === "GET" && path.startsWith("/dashboard") && !userId) {
    console.log("BLOCKING dashboard for unauth user");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Block home if logged in
  if (method === "GET" && path === "/" && userId) {
    console.log("REDIRECTING logged-in user to dashboard");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/api/(.*)",
  ],
};



