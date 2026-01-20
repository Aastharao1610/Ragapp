"use client";
import Header from "@/components/Header/Header";
import { SignInButton, useUser } from "@clerk/nextjs";
import { SignedOut, SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Database, MessageSquare, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isSignedIn, isLoaded, user } = useUser();
  // const router = useRouter();

  console.log("🏠 HOME RENDER:", {
    isLoaded,
    isSignedIn,
    userId: user?.id,
  });
  // useEffect(() => {
  //   console.log("🏠 HOME EFFECT:", { isLoaded, isSignedIn });
  //   if (isLoaded) return;
  //   if (isSignedIn) {
  //     console.log("⏳ HOME WAITING FOR CLERK");
  //     router.replace("/dashboard");
  //   }
  // }, [isLoaded, isSignedIn]);
  // if (!isLoaded) return null;
  return (
    <div className="min-h-screen  text-slate-900 selection:bg-indigo-100">
      <Header />

      <main className="max-w-6xl mx-auto px-6 pt-48 pb-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-8 py-12">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900">
            Chat with your <span className="text-indigo-600">Data</span> <br />
            in seconds.
          </h1>

          <p className="max-w-2xl text-lg text-slate-600 leading-relaxed">
            The professional RAG platform that turns your documents into an
            intelligent knowledge base. Upload, analyze, and get answers
            instantly.
          </p>

          {/* <div className="flex items-center gap-4">
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold cursor-pointer transition-all shadow-lg shadow-indigo-200">
                Get Started <ArrowRight size={18} />
              </button>
            </SignInButton>
          </div> */}
        </div>
      </main>
    </div>
  );
}
