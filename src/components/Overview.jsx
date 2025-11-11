import {
  EyeIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const funnelData = [
  { label: "Completed (>80%)", value: 1873, total: 2438 },
  { label: "Questions Asked", value: 831, total: 2438 },
  { label: "Meeting Booked", value: 149, total: 2438 },
];

const activity = [
  {
    name: "John Smith",
    time: "5 minutes ago",
    demo: "Product Overview",
    questions: 2,
    action: "watched demo",
    initial: "J",
  },
  {
    name: "Sarah Johnson",
    time: "27 minutes ago",
    demo: "Enterprise Features",
    questions: 4,
    action: "booked meeting",
    initial: "S",
  },
  {
    name: "Michael Davis",
    time: "1 hour ago",
    demo: "Security Features",
    questions: 1,
    action: "watched demo",
    initial: "M",
  },
  {
    name: "Emily Wong",
    time: "3 hours ago",
    demo: "Integration Options",
    questions: 3,
    action: "watched demo",
    initial: "E",
  },
];

const Overview = () => {
  return (
    <div className="p-4 sm:p-6 space-y-6 dashboard-font">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Overview</h2>
        <Link to="/create" className="w-full sm:w-auto">
          <button className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 flex items-center justify-center gap-2">
            Create Qudemo
          </button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Total Qudemo Views"
          value="2,438"
          change="+12.5%"
          icon={<EyeIcon className="h-8 w-8 text-blue-600" />}
          bg="bg-blue-100"
        />
        <Card
          title="Questions Asked"
          value="831"
          change="+18.2%"
          icon={
            <ChatBubbleLeftEllipsisIcon className="h-8 w-8 text-green-600" />
          }
          bg="bg-green-100"
        />
        <Card
          title="Meetings Booked"
          value="149"
          change="+6.8%"
          icon={<UsersIcon className="h-8 w-8 text-purple-600" />}
          bg="bg-purple-100"
        />
        <Card
          title="Avg. Engagement"
          value="73%"
          change="+4.3%"
          icon={<ChartBarIcon className="h-8 w-8 text-yellow-600" />}
          bg="bg-yellow-100"
        />
      </div>

      {/* Funnel and Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border">
          <h3 className="text-lg font-semibold mb-1">Conversion Funnel</h3>
          <p className="text-gray-500 mb-4 text-sm">
            How users progress through your demos
          </p>

          <div className="space-y-4">
            {funnelData.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${(item.value / item.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border">
          <h3 className="text-lg font-semibold mb-1">Recent Activity</h3>
          <p className="text-gray-500 mb-4 text-sm">
            Latest interactions with your demos
          </p>

          <ul className="space-y-4">
            {activity.map((user, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                  {user.initial}
                </div>
                <div className="text-sm">
                  <span className="font-medium">{user.name}</span> {user.action}{" "}
                  demo <span className="font-semibold">{user.demo}</span>
                  <div className="text-gray-500 text-xs mt-1">
                    {user.time} • {user.questions} questions asked
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Card component
const Card = ({ title, value, change, icon, bg }) => (
  <div className="bg-white p-4 sm:p-5 rounded-xl border shadow-sm">
    <div className="flex items-center mb-1">
      <h4 className="text-sm text-gray-500 font-medium">{title}</h4>
      <div className={`p-2 rounded-full ${bg} ml-auto`}>{icon}</div>
    </div>
    <div className="text-xl sm:text-2xl font-bold">{value}</div>
    <div className="text-green-600 text-sm font-medium mt-1">
      {change} vs last month
    </div>
  </div>
);

export default Overview;
