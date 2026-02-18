"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [bookmarks, setBookmarks] = useState([]);
  const [url, setUrl] = useState("");

  async function fetchBookmarks() {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at");
    setBookmarks(data || []);
  }

  async function addBookmark() {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("bookmarks").insert({
      url,
      title: url,
      user_id: user.id
    });

    setUrl("");
  }

  async function deleteBookmark(id) {
    await supabase.from("bookmarks").delete().eq("id", id);
  }

  useEffect(() => {
    fetchBookmarks();

    const channel = supabase
      .channel("bookmarks")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookmarks" }, fetchBookmarks)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Your Bookmarks</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="border px-3 py-2 rounded"
        />
        <button onClick={addBookmark} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add
        </button>
      </div>

      <ul className="space-y-3">
        {bookmarks.map(b => (
          <li key={b.id} className="flex justify-between items-center border p-3 rounded">
            <a href={b.url} target="_blank" className="text-blue-600">{b.title}</a>
            <button
              className="text-red-500"
              onClick={() => deleteBookmark(b.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
