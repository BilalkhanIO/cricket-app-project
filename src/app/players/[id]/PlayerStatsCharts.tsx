"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

interface ChartData {
  match: string;
  runs?: number;
  wickets?: number;
}

export default function PlayerStatsCharts({
  battingData,
  bowlingData,
}: {
  battingData: ChartData[];
  bowlingData: ChartData[];
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Charts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {battingData.length > 1 && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">🏏 Runs Per Match</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={battingData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v) => [`${v} runs`, "Runs"]}
                  />
                  <Bar dataKey="runs" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        {bowlingData.length > 1 && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">🎳 Wickets Per Match</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bowlingData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v) => [`${v} wicket${v !== 1 ? "s" : ""}`, "Wickets"]}
                  />
                  <Bar dataKey="wickets" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
      </div>
    </section>
  );
}
