"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROLES, ROUTES } from "@/lib/constants";

function LoginFormFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-[#EB0A1E] animate-spin" />
      <p className="mt-4 text-sm text-[#767676] font-sans">Loading portal security...</p>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError || !authData.user) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();

      if (roleError || !roleData) {
        // No role mapped — sign out to prevent unauthorized access
        await supabase.auth.signOut();
        setError("No authorized role assigned to this account.");
        setIsLoading(false);
        return;
      }

      const role = roleData.role;

      const dashboardUrl =
        role === ROLES.ADMIN
          ? ROUTES.ADMIN_DASHBOARD
          : ROUTES.OFFICER_DASHBOARD;

      router.push(redirectTo || dashboardUrl);
    } catch (err) {
      console.error("Authentication error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col" noValidate>

      <div className="relative mb-4">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          placeholder="Email address"
          className="w-full h-[44px] px-4 font-sans text-[14px] text-[#0A0A0A] placeholder-[#767676] bg-white border-[1.5px] border-[#E0E0E0] rounded-[4px] transition-colors focus:border-[#EB0A1E] focus:ring-1 focus:ring-[#EB0A1E] outline-none disabled:opacity-50"
          autoComplete="email"
          required
        />
      </div>

      <div className="relative mb-6">
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          placeholder="Password"
          className="w-full h-[44px] pl-4 pr-12 font-sans text-[14px] text-[#0A0A0A] placeholder-[#767676] bg-white border-[1.5px] border-[#E0E0E0] rounded-[4px] transition-colors focus:border-[#EB0A1E] focus:ring-1 focus:ring-[#EB0A1E] outline-none disabled:opacity-50"
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={isLoading}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#767676] hover:text-[#0A0A0A] transition-colors focus:outline-none disabled:opacity-50"
        >
          {showPassword ? (
            <EyeOff className="w-[18px] h-[18px]" />
          ) : (
            <Eye className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="w-full mb-6 text-left text-[13px] font-sans text-[#EB0A1E] font-medium leading-tight"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-[44px] bg-[#EB0A1E] hover:bg-[#C5081A] text-white font-sans font-semibold text-[15px] rounded-none transition-colors duration-200 flex items-center justify-center focus:ring-2 focus:ring-[#EB0A1E] focus:ring-offset-2 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#0A0A0A] overflow-hidden select-none">

      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform scale-105"
        style={{
          backgroundImage:
            "url('/toyota.jpg')",
          transitionDuration: "10000ms",
        }}
      />

      <div className="absolute inset-0 bg-black/65" />

      <section className="relative z-10 w-full max-w-[420px] bg-white rounded-[4px] p-[48px] shadow-[0_12px_40px_rgba(0,0,0,0.3)] mx-4">

        <div className="flex justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EB0A1E"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[56px] h-auto"
            aria-label="Toyota Logo"
          >
            {/* Outer large oval */}
            <path d="M12 12m-10 0a10 7 0 1 0 20 0a10 7 0 1 0 -20 0" />
            {/* Inner vertical oval */}
            <path d="M9 12c0 3.866 1.343 7 3 7s3 -3.134 3 -7s-1.343 -7 -3 -7s-3 3.134 -3 7z" />
            {/* Inner horizontal oval */}
            <path d="M6.415 6.191c-.888 .503 -1.415 1.13 -1.415 1.809c0 1.657 3.134 3 7 3s7 -1.343 7 -3c0 -.678 -.525 -1.304 -1.41 -1.806" />
          </svg>
        </div>

        <h1 className="text-center font-sans font-bold text-[22px] text-[#0A0A0A] leading-tight mb-[4px]">
          Incentive Portal
        </h1>
        <p className="text-center font-sans font-normal text-[13px] text-[#767676] mb-[36px]">
          Nippon Toyota
        </p>

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        <footer className="mt-[24px] text-center">
          <p className="font-sans font-normal text-[12px] text-[#767676] tracking-wide">
            Authorized personnel only
          </p>
        </footer>
      </section>
    </main>
  );
}
