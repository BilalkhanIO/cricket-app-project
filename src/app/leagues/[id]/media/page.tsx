"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { useSession } from "next-auth/react";

export const dynamic = 'force-dynamic';

export default function LeagueMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [media, setMedia] = useState<any[]>([]);
  const [leagueName, setLeagueName] = useState("");
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [type, setType] = useState("IMAGE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const isAdmin = session && ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);

  useEffect(() => {
    fetch(`/api/leagues/${id}`)
      .then((r) => r.json())
      .then((d) => setLeagueName(d.league?.name || "League"));

    fetchMedia();
  }, [id]);

  const fetchMedia = async () => {
    const res = await fetch(`/api/leagues/${id}/media`);
    const data = await res.json();
    setMedia(data.media || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setMessage("");

    const res = await fetch(`/api/leagues/${id}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, type, title, description }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Media uploaded successfully!");
      setUrl("");
      setTitle("");
      setDescription("");
      fetchMedia();
    } else {
      setMessage(data.error || "Failed to upload");
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="bg-[#1B3A5C] text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/leagues/${id}`} className="text-[#B9D7EA] text-sm hover:text-white">
                ← {leagueName}
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Media Gallery</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isAdmin && (
            <div className="mb-6">
              <Button onClick={() => setShowUpload(!showUpload)} variant="primary">
                {showUpload ? "Hide Upload Form" : "+ Upload Media"}
              </Button>

              {showUpload && (
                <div className="mt-4 bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Upload Media</h3>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Media URL *</label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="IMAGE">Image</option>
                        <option value="VIDEO">Video</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Photo caption..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    {message && (
                      <p className={`text-sm ${message.includes("success") ? "text-[#769FCD]" : "text-red-600"}`}>
                        {message}
                      </p>
                    )}
                    <Button type="submit" variant="primary" disabled={uploading || !url} fullWidth>
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-[#769FCD] border-t-transparent rounded-full"></div>
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📷</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Media Yet</h3>
              <p className="text-gray-500">Photos and videos will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {media.map((item) => (
                <div key={item.id} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
                  {item.type === "IMAGE" ? (
                    <img
                      src={item.url}
                      alt={item.title || "Media"}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎬</div>
                        <p className="text-xs text-gray-300">{item.title || "Video"}</p>
                      </div>
                    </div>
                  )}
                  {(item.title || item.description) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.title && <p className="text-white text-xs font-medium">{item.title}</p>}
                      {item.description && <p className="text-gray-300 text-xs mt-0.5">{item.description}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
