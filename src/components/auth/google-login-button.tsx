"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signInError) {
      setError("Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={isLoading}
        onClick={handleGoogleLogin}
      >
        <GoogleIcon />
        {isLoading ? "Google로 이동 중…" : "Google로 계속하기"}
      </Button>

      {error ? (
        <p role="alert" className="mt-4 text-sm leading-relaxed text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" role="img">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.76-5.62-4.13H3.03v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.38 13.86A6.02 6.02 0 0 1 6.06 12c0-.65.11-1.28.32-1.86V7.52H3.03A10 10 0 0 0 2 12c0 1.61.39 3.14 1.03 4.48l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.01c1.47 0 2.79.5 3.82 1.5l2.88-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.97 5.52l3.35 2.62C7.17 7.77 9.39 6.01 12 6.01Z"
      />
    </svg>
  );
}
