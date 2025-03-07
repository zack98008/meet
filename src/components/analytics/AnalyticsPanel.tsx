import React, { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";

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
  const [loading, setLoading] = useState(true);
  const [realParticipantData, setRealParticipantData] = useState<any[]>([]);
  const [realMeetingData, setRealMeetingData] = useState<any[]>([]);
  const [meetingStats, setMeetingStats] = useState({
    totalMeetings: 0,
    totalDuration: "0h 0m",
    avgParticipants: 0,
    avgDuration: "0h 0m",
    avgEngagement: 0,
  });

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch participants data
        const { data: participants, error: participantsError } = await supabase
          .from("participants")
          .select("*")
          .order("join_time", { ascending: false });

        if (participantsError) throw participantsError;

        // Fetch meeting metadata
        const { data: meetings, error: meetingsError } = await supabase
          .from("meeting_metadata")
          .select("*")
          .order("start_time", { ascending: false });

        if (meetingsError) throw meetingsError;

        // Process data for statistics
        if (meetings && meetings.length > 0) {
          // Calculate total duration in minutes
          let totalDurationMinutes = 0;
          meetings.forEach((meeting) => {
            if (meeting.start_time && meeting.end_time) {
              const start = new Date(meeting.start_time);
              const end = new Date(meeting.end_time || new Date());
              const durationMinutes = Math.floor(
                (end.getTime() - start.getTime()) / (1000 * 60),
              );
              totalDurationMinutes += durationMinutes;
            }
          });

          // Calculate average participants per meeting
          const meetingParticipantCounts = {};
          participants.forEach((participant) => {
            if (!meetingParticipantCounts[participant.meeting_id]) {
              meetingParticipantCounts[participant.meeting_id] = 0;
            }
            meetingParticipantCounts[participant.meeting_id]++;
          });

          const avgParticipants =
            Object.values(meetingParticipantCounts).length > 0
              ? Math.round(
                  Object.values(meetingParticipantCounts).reduce(
                    (sum: any, count: any) => sum + count,
                    0,
                  ) / Object.values(meetingParticipantCounts).length,
                )
              : 0;

          // Format durations
          const totalHours = Math.floor(totalDurationMinutes / 60);
          const totalMinutes = totalDurationMinutes % 60;
          const totalDurationFormatted = `${totalHours}h ${totalMinutes}m`;

          const avgDurationMinutes =
            meetings.length > 0
              ? Math.round(totalDurationMinutes / meetings.length)
              : 0;
          const avgHours = Math.floor(avgDurationMinutes / 60);
          const avgMinutes = avgDurationMinutes % 60;
          const avgDurationFormatted = `${avgHours}h ${avgMinutes}m`;

          // Update stats
          setMeetingStats({
            totalMeetings: meetings.length,
            totalDuration: totalDurationFormatted,
            avgParticipants,
            avgDuration: avgDurationFormatted,
            avgEngagement: Math.round(Math.random() * 30) + 60, // Placeholder for now
          });
        }

        // Set the data
        setRealParticipantData(participants || []);
        setRealMeetingData(meetings || []);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
              data={
                realMeetingData.length > 0
                  ? realMeetingData.map((m) => ({
                      date: new Date(m.start_time).toLocaleDateString(),
                      participants: m.participants?.length || 0,
                      duration: m.end_time
                        ? Math.floor(
                            (new Date(m.end_time).getTime() -
                              new Date(m.start_time).getTime()) /
                              (1000 * 60),
                          )
                        : 60, // Default to 60 minutes if no end time
                      engagement: Math.round(Math.random() * 30) + 60, // Placeholder
                    }))
                  : meetingData
              }
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

          <ParticipantEngagementTable
            data={
              realParticipantData.length > 0
                ? realParticipantData.map((p) => ({
                    id: p.id,
                    name: p.name,
                    email: p.email || "Unknown",
                    joinTime: new Date(p.join_time).toLocaleTimeString(),
                    leaveTime: p.leave_time
                      ? new Date(p.leave_time).toLocaleTimeString()
                      : "Still active",
                    duration: p.leave_time
                      ? `${Math.floor((new Date(p.leave_time).getTime() - new Date(p.join_time).getTime()) / (1000 * 60))}m`
                      : "Ongoing",
                    speakingTime: `${p.speaking_time || 0}m`,
                    engagementScore: Math.round(Math.random() * 40) + 60, // Placeholder
                    status: p.is_muted
                      ? "muted"
                      : p.is_camera_on
                        ? "active"
                        : "video-off",
                    role: p.is_host ? "host" : "participant",
                  }))
                : participantData
            }
          />
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
            data={
              realMeetingData.length > 0
                ? realMeetingData.map((m) => ({
                    date: new Date(m.start_time).toLocaleDateString(),
                    participants: m.participants?.length || 0,
                    duration: m.end_time
                      ? Math.floor(
                          (new Date(m.end_time).getTime() -
                            new Date(m.start_time).getTime()) /
                            (1000 * 60),
                        )
                      : 60, // Default to 60 minutes if no end time
                    engagement: Math.round(Math.random() * 30) + 60, // Placeholder
                  }))
                : meetingData
            }
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

          <ParticipantEngagementTable
            data={
              realParticipantData.length > 0
                ? realParticipantData.map((p) => ({
                    id: p.id,
                    name: p.name,
                    email: p.email || "Unknown",
                    joinTime: new Date(p.join_time).toLocaleTimeString(),
                    leaveTime: p.leave_time
                      ? new Date(p.leave_time).toLocaleTimeString()
                      : "Still active",
                    duration: p.leave_time
                      ? `${Math.floor((new Date(p.leave_time).getTime() - new Date(p.join_time).getTime()) / (1000 * 60))}m`
                      : "Ongoing",
                    speakingTime: `${p.speaking_time || 0}m`,
                    engagementScore: Math.round(Math.random() * 40) + 60, // Placeholder
                    status: p.is_muted
                      ? "muted"
                      : p.is_camera_on
                        ? "active"
                        : "video-off",
                    role: p.is_host ? "host" : "participant",
                  }))
                : participantData
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPanel;
