import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { roleColors } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
      city: true,
      createdAt: true,
    },
  });
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users ({users.length})</h1>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Email</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Role</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">City</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#D6E6F2] rounded-full flex items-center justify-center text-xs font-bold text-[#1B3A5C]">
                        {user.name.charAt(0)}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{user.email}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || "bg-gray-100 text-gray-800"}`}>
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{user.city || "-"}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? "bg-[#D6E6F2] text-[#1B3A5C]" : "bg-red-100 text-red-700"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-center py-10 text-gray-400">No users found</p>}
        </div>
      </Card>
    </div>
  );
}
