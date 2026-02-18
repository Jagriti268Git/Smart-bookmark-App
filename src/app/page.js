"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const [url, setUrl] = useState("");

  // Initialize user session and listen for auth changes
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    initAuth();

    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch bookmarks for the logged-in user
  const fetchBookmarks = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!error) setBookmarks(data || []);
    else console.error("Error fetching bookmarks:", error);
  };

  // Setup Realtime updates filtered by user_id
  useEffect(() => {
    if (!user) return;

    fetchBookmarks();

    const channel = supabase
      .channel("bookmarks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}` // crucial filter!
        },
        fetchBookmarks
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // Add bookmark (RLS-safe)
  const addBookmark = async () => {
    if (!user) return alert("Please login first");
    if (!url.trim()) return;

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ url, title: url, user_id: user.id })
      .select();

    if (!error && data) {
      setBookmarks(prev => [...prev, ...data]);
      setUrl("");
    } else console.error("Error adding bookmark:", error);
  };

  // Delete bookmark (RLS-safe)
  const deleteBookmark = async (id) => {
    const { error, count } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) console.error("Delete failed:", error);
    else if (count === 0) console.warn("No rows deleted — check RLS or user_id");
    else setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  if (loading) return <p className="p-10 text-center">Checking session...</p>;

  // Show login link if not logged in
  if (!user) {
    return (
      <div className="h-screen flex flex-col justify-center items-center text-center">
        <p className="mb-4">Please login to see your bookmarks.</p>
        <a
          href="/login"
          className="bg-black text-white px-6 py-3 rounded-md"
        >
          Login with Google
        </a>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Bookmarks</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="border px-3 py-2 rounded flex-1"
        />
        <button
          onClick={addBookmark}
          disabled={!url.trim()}
          className="bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      <ul className="space-y-3">
        {bookmarks.map(b => (
          <li key={b.id} className="flex justify-between items-center border p-3 rounded">
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 break-all"
            >
              {b.title}
            </a>
            <button
              className="text-red-500"
              onClick={() => deleteBookmark(b.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {bookmarks.length === 0 && <p className="text-gray-500 mt-4">No bookmarks yet.</p>}

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          setUser(null);
          setBookmarks([]);
        }}
        className="bg-gray-600 text-white px-4 py-2 rounded mt-6"
      >
        Logout
      </button>
    </div>
  );
}
