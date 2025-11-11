import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const weeklyData = [
  { day: "Mon", Views: 120, Questions: 10, Meetings: 2 },
  { day: "Tue", Views: 200, Questions: 15, Meetings: 4 },
  { day: "Wed", Views: 150, Questions: 8, Meetings: 3 },
  { day: "Thu", Views: 180, Questions: 12, Meetings: 5 },
  { day: "Fri", Views: 220, Questions: 18, Meetings: 6 },
  { day: "Sat", Views: 90, Questions: 4, Meetings: 1 },
  { day: "Sun", Views: 130, Questions: 6, Meetings: 2 },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Insights & Analytics</h2>
        <Link to="/create">
          <button className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 flex items-center gap-2">
            + Create Qudemo
          </button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Conversion Rate",
            value: "8.4%",
            sub: "Demo views → Meeting booked",
            change: "+1.2%",
            color: "text-green-500",
          },
          {
            title: "Avg. Engagement Score",
            value: "72%",
            sub: "Based on view time and interactions",
            change: "+3.5%",
            color: "text-green-500",
          },
          {
            title: "Questions per Demo",
            value: "2.8",
            sub: "Average questions asked per view",
            change: "+0.3",
            color: "text-green-500",
          },
          {
            title: "Completion Rate",
            value: "68%",
            sub: "Viewers watching over 80% of demo",
            change: "-2.1%",
            color: "text-red-500",
          },
        ].map((metric, idx) => (
          <div key={idx} className="bg-white p-4 rounded shadow-sm border">
            <div className="text-sm text-gray-600">{metric.title}</div>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="text-sm text-gray-500">{metric.sub}</div>
            <div className={`text-sm font-medium ${metric.color}`}>
              {metric.change}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          "Performance",
          "Questions",
          "Drop-off Points",
          "Suggested Improvements",
        ].map((tab, i) => (
          <button
            key={i}
            className={`px-4 py-2 rounded ${
              i === 0
                ? "bg-gray-200 text-black"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Weekly Activity Bar Chart */}
      <div className="bg-white p-4 rounded shadow-sm border">
        <h3 className="text-xl font-semibold mb-1">Weekly Activity</h3>
        <p className="text-sm text-gray-500 mb-4">
          Demo views, questions and meetings over the past week
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Views" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Questions" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Meetings" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demo Performance Table */}
      <div className="bg-white p-4 rounded shadow-sm border">
        <h3 className="text-xl font-semibold mb-1">Demo Performance</h3>
        <p className="text-sm text-gray-500 mb-4">Metrics by demo</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-600 border-b">
                <th className="py-2">Demo</th>
                <th>Views</th>
                <th>Completion %</th>
                <th>Questions</th>
                <th>Conversion %</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Product Overview", 827, "86%", 142, "3.4%"],
                ["Enterprise Features", 543, "72%", 98, "3.5%"],
                ["Integration Options", 412, "68%", 76, "2.9%"],
                ["Security Features", 389, "77%", 65, "3.9%"],
                ["Pricing Overview", 267, "59%", 54, "3.0%"],
              ].map(([demo, views, comp, questions, conv], i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="py-2">{demo}</td>
                  <td>{views}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-20 rounded-full ${
                          parseInt(comp) >= 75
                            ? "bg-green-500"
                            : parseInt(comp) >= 60
                              ? "bg-yellow-400"
                              : "bg-red-500"
                        }`}
                      />
                      <span>{comp}</span>
                    </div>
                  </td>
                  <td>{questions}</td>
                  <td>{conv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
