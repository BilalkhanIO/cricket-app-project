"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

const ROLES = ["BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKETKEEPER"];
const BATTING_HANDS = ["RIGHT", "LEFT"];
const BOWLING_TYPES = [
  "RIGHT_ARM_FAST",
  "RIGHT_ARM_MEDIUM",
  "RIGHT_ARM_SPIN",
  "LEFT_ARM_FAST",
  "LEFT_ARM_MEDIUM",
  "LEFT_ARM_SPIN",
];

export default function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [role, setRole] = useState("BATSMAN");
  const [battingHand, setBattingHand] = useState("RIGHT");
  const [bowlingType, setBowlingType] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [isViceCaptain, setIsViceCaptain] = useState(false);
  const [isWicketkeeper, setIsWicketkeeper] = useState(false);
  const [medicalStatus, setMedicalStatus] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("AVAILABLE");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.player) {
          const p = d.player;
          setPlayer(p);
          setRole(p.role || "BATSMAN");
          setBattingHand(p.battingHand || "RIGHT");
          setBowlingType(p.bowlingType || "");
          setJerseyNumber(p.jerseyNumber?.toString() || "");
          setBio(p.bio || "");
          setProfileImage(p.user?.profileImage || "");
          setIsCaptain(p.isCaptain || false);
          setIsViceCaptain(p.isViceCaptain || false);
          setIsWicketkeeper(p.isWicketkeeper || false);
          setMedicalStatus(p.medicalStatus || "");
          setAvailabilityStatus(p.availabilityStatus || "AVAILABLE");
          setPhotoUrl(p.photoUrl || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!role) errs.role = "Role is required";
    if (!battingHand) errs.battingHand = "Batting hand is required";
    if (jerseyNumber && (isNaN(Number(jerseyNumber)) || Number(jerseyNumber) < 0 || Number(jerseyNumber) > 999)) {
      errs.jerseyNumber = "Jersey number must be between 0 and 999";
    }
    if (profileImage && !profileImage.startsWith("http")) {
      errs.profileImage = "Profile image must be a valid URL";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setMessage("");

    const data: any = {
      role,
      battingHand,
      bowlingType: bowlingType || null,
      jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
      bio: bio || null,
      isCaptain,
      isViceCaptain,
      isWicketkeeper,
      medicalStatus: medicalStatus || null,
      availabilityStatus,
      photoUrl: photoUrl || null,
    };

    const res = await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok) {
      setMessage("Player updated successfully!");
      setTimeout(() => router.push(`/players/${id}`), 1500);
    } else {
      setMessage(result.error || "Failed to update player");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#769FCD] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Player not found</p>
        <Link href="/admin/players" className="text-[#769FCD] hover:underline mt-2 block">
          Back to Players
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/players" className="text-gray-500 text-sm hover:text-gray-700">← Players</Link>
        <Link href={`/players/${id}`} className="text-gray-500 text-sm hover:text-gray-700">
          {player.user?.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Player</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#D6E6F2] rounded-full flex items-center justify-center font-bold text-[#1B3A5C] text-lg">
              {player.user?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{player.user?.name}</h2>
              <p className="text-sm text-gray-500">{player.user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role & Hand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#769FCD]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace("_", " ")}</option>
                  ))}
                </select>
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batting Hand *</label>
                <select
                  value={battingHand}
                  onChange={(e) => setBattingHand(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#769FCD]"
                >
                  {BATTING_HANDS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {errors.battingHand && <p className="text-red-500 text-xs mt-1">{errors.battingHand}</p>}
              </div>
            </div>

            {/* Bowling Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bowling Type</label>
              <select
                value={bowlingType}
                onChange={(e) => setBowlingType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#769FCD]"
              >
                <option value="">None / Unknown</option>
                {BOWLING_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            {/* Jersey Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Number</label>
              <input
                type="number"
                min={0}
                max={999}
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#769FCD]"
                placeholder="e.g. 10"
              />
              {errors.jerseyNumber && <p className="text-red-500 text-xs mt-1">{errors.jerseyNumber}</p>}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#769FCD]"
                placeholder="Short player bio..."
              />
            </div>

            {/* Profile Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#769FCD]"
                placeholder="https://example.com/photo.jpg"
              />
              {errors.profileImage && <p className="text-red-500 text-xs mt-1">{errors.profileImage}</p>}
            </div>

            {/* Photo URL (player-specific, separate from user profile image) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player Photo URL</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#769FCD]"
                placeholder="https://example.com/player.jpg"
              />
            </div>

            {/* Availability & Medical */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#769FCD]"
                >
                  {["AVAILABLE", "UNAVAILABLE", "INJURED", "SUSPENDED", "ON_TOUR"].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical / Fitness Status</label>
                <input
                  type="text"
                  value={medicalStatus}
                  onChange={(e) => setMedicalStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#769FCD]"
                  placeholder="e.g. Fit, Hamstring strain..."
                />
              </div>
            </div>

            {/* Flags */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCaptain}
                  onChange={(e) => setIsCaptain(e.target.checked)}
                  className="w-4 h-4 text-[#769FCD] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Captain</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isViceCaptain}
                  onChange={(e) => setIsViceCaptain(e.target.checked)}
                  className="w-4 h-4 text-[#769FCD] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Vice Captain</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWicketkeeper}
                  onChange={(e) => setIsWicketkeeper(e.target.checked)}
                  className="w-4 h-4 text-[#769FCD] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Wicketkeeper</span>
              </label>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.includes("success") ? "bg-[#D6E6F2] text-[#1B3A5C]" : "bg-red-50 text-red-700"}`}>
                {message}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
              <Link href="/admin/players">
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
