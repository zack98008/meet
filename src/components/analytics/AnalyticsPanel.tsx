import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import {
  Calendar,
  Download,
  FileText,
  BarChart2,
  PieChart,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import MeetingMetricsChart from "./MeetingMetricsChart";
import ParticipantEngagementTable from "./ParticipantEngagementTable";

interface AnalyticsPanelProps {
  activeTab?: string;
  meetingData?: any;
  participantData?: any;
}

const AnalyticsPanel = ({
  activeTab = "overview",
  meetingData,
  participantData,
}: AnalyticsPanelProps) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("weekly");
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  // Mock data for meeting statistics
  const meetingStats = {
    totalMeetings: 24,
    totalDuration: "36h 45m",
    avgParticipants: 18,
    avgDuration: "1h 32m",
    avgEngagement: 76,
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 text-white p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-400">
            View meeting statistics and participant engagement metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-[400px] bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {meetingStats.totalMeetings}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {meetingStats.totalDuration}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Avg. Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart2 className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {meetingStats.avgEngagement}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MeetingMetricsChart
              data={meetingData}
              timeRange={selectedTimeRange}
              chartType={chartType}
            />
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[280px]">
                {/* Placeholder for a pie chart - would use recharts in a real implementation */}
                <div className="flex flex-col items-center justify-center text-center">
                  <PieChart className="h-24 w-24 text-gray-500 mb-4" />
                  <p className="text-gray-400">
                    Engagement distribution by participant type
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <ParticipantEngagementTable data={participantData} />
        </TabsContent>

        <TabsContent value="meetings" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Meeting History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <FileText className="h-16 w-16 text-gray-500 mb-4" />
                <p className="text-gray-400">
                  Detailed meeting history and analytics
                </p>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  View All Meetings
                </Button>
              </div>
            </CardContent>
          </Card>

          <MeetingMetricsChart
            data={meetingData}
            timeRange={selectedTimeRange}
            chartType={chartType}
          />
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Participant Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <BarChart2 className="h-16 w-16 text-gray-500 mb-4" />
                <p className="text-gray-400">
                  Detailed participant engagement analytics
                </p>
              </div>
            </CardContent>
          </Card>

          <ParticipantEngagementTable data={participantData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPanel;
