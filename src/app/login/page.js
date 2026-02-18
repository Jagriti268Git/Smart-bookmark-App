"use client";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    async function signInWithGithub() {
        await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: "http://localhost:3000/"
            }
        });
    }

    return (
        <div className="h-screen flex justify-center items-center">
            <button
                onClick={signInWithGithub}
                className="bg-black text-white px-6 py-3 rounded-md"
            >
                Login with GitHub
            </button>
        </div>
    );
}
