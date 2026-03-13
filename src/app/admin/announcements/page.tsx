import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getAnnouncements() {
  return prisma.announcement.findMany({
    include: {
      author: { select: { name: true } },
      league: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminAnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Announcements ({announcements.length})</h1>
        <Link href="/admin/announcements/new" className="bg-[#769FCD] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#5A8BBE]">
          + Post Announcement
        </Link>
      </div>

      <div className="space-y-3">
        {announcements.map((ann) => (
          <Card key={ann.id}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{ann.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{ann.content}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>by {ann.author.name}</span>
                    {ann.league && <span>· {ann.league.name}</span>}
                    <span>· {formatDateTime(ann.createdAt)}</span>
                    <span className={`px-2 py-0.5 rounded ${ann.isPublic ? "bg-[#D6E6F2] text-[#1B3A5C]" : "bg-gray-100 text-gray-600"}`}>
                      {ann.isPublic ? "Public" : "Private"}
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}

        {announcements.length === 0 && (
          <Card>
            <CardBody className="text-center py-10">
              <div className="text-4xl mb-3">📢</div>
              <h3 className="font-semibold text-gray-700 mb-2">No Announcements</h3>
              <Link href="/admin/announcements/new" className="text-[#769FCD] hover:underline text-sm">Post your first announcement →</Link>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
