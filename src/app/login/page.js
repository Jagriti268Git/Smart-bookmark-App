"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    // Clear any old session on mount
    useEffect(() => {
        supabase.auth.signOut();
    }, []);

    // Trigger Google OAuth login
    const signInWithGoogle = async () => {
        try {
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    // Use localhost for dev, replace with production URL when deploying
                    redirectTo: "http://localhost:3000/"
                }
            });
        } catch (error) {
            console.error("Google login error:", error);
            alert("Failed to login with Google. Check console for details.");
        }
    };

    return (
        <div className="h-screen flex flex-col justify-center items-center bg-gray-50">
            <h1 className="text-3xl font-bold mb-6">Login to Bookmark App</h1>
            <button
                onClick={signInWithGoogle}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md transition"
            >
                Login with Google
            </button>
            <p className="text-gray-500 mt-4 text-sm">
                You will be redirected to Google to sign in.
            </p>
        </div>
    );
}
