"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Please login to view your profile.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="bg-green-800 text-white py-8">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-2xl font-bold">My Profile</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card>
              <CardBody className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-3xl font-bold text-green-700 mx-auto mb-3">
                  {session.user.name.charAt(0)}
                </div>
                <h2 className="font-bold text-xl text-gray-900">{session.user.name}</h2>
                <p className="text-gray-500 text-sm">{session.user.email}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {session.user.role.replace("_", " ")}
                  </span>
                </div>
              </CardBody>
            </Card>

            {/* Stats/Info */}
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader><h3 className="font-semibold text-gray-900">Account Information</h3></CardHeader>
                <CardBody className="space-y-3">
                  {[
                    { label: "Full Name", value: session.user.name },
                    { label: "Email", value: session.user.email },
                    { label: "Role", value: session.user.role.replace("_", " ") },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>

              <Card>
                <CardHeader><h3 className="font-semibold text-gray-900">Quick Links</h3></CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-2">
                    {session.user.role === "SUPER_ADMIN" || session.user.role === "LEAGUE_ADMIN" ? (
                      <>
                        <a href="/admin" className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-sm font-medium text-green-800 text-center transition-colors">
                          Admin Dashboard
                        </a>
                        <a href="/admin/leagues/new" className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium text-blue-800 text-center transition-colors">
                          Create League
                        </a>
                      </>
                    ) : null}
                    {session.user.role === "SCORER" ? (
                      <a href="/matches" className="p-3 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-800 text-center transition-colors">
                        Score a Match
                      </a>
                    ) : null}
                    <a href="/matches" className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-800 text-center transition-colors">
                      View Matches
                    </a>
                    <a href="/stats" className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium text-purple-800 text-center transition-colors">
                      Statistics
                    </a>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
