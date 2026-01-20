import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Bot, Sparkles, LayoutDashboard } from "lucide-react";
import Link from "next/link";

const Header = () => {
  return (
    <>
      <div className="sticky top-0 z-50 py-4  ">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          {/* Left Side: Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-tr from-[#4285f4] via-[#9b72cb]  to-[#d96570] p-2 rounded-xl group-hover:scale-105 transition-transform duration-300">
              <Bot size={20} className="text-white" />
            </div>
            <span className="text-xl font-medium tracking-tight text-[#e3e3e3]">
              RAG<span className="text-[#c4c7c5]">AI</span>
            </span>
          </Link>

          {/* Right Side: Auth Actions */}
          <div className="flex items-center gap-3">
            <SignedOut>
              {/* <SignInButton mode="modal" > */}
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="text-sm px-5 py-2.5 rounded-full font-medium text-[#c4c7c5] hover:bg-[#333537] hover:text-white transition-all cursor-pointer border border-[#444746]">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              {/* Minimalist Dashboard Link */}
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#c4c7c5] hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-[#333537]"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>

              {/* User Profile - Matches Sidebar Pill Style */}
              <div className="ml-2 pl-2 border-l border-[#333537]">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox:
                        "h-9 w-9 border border-[#444746] hover:border-[#c2e7ff] transition-colors",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
