import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Clock,
  Download,
  MoreHorizontal,
  Search,
  UserPlus,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

// Define interface that matches the data structure from the content script
interface GoogleMeetParticipant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  hasCamera: boolean;
  isCameraOn: boolean;
  joinTime: string;
}

// Our enhanced participant type with additional fields
interface Participant {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinTime: string;
  status: "active" | "inactive" | "speaking" | "muted" | "video-off";
  duration: string;
  speakingTime: string;
  role: "host" | "co-host" | "participant" | "guest";
}

interface ParticipantPanelProps {
  meetingStatus?: "in-progress" | "scheduled" | "ended";
  currentView?: "list" | "grid" | "activity";
}

// Function to convert Google Meet participant to our enhanced format
const convertGoogleMeetParticipant = (
  participant: GoogleMeetParticipant,
  joinTimes: Record<string, Date>,
): Participant => {
  // Generate email if not available
  const email = `${participant.name.toLowerCase().replace(/\s+/g, ".")}@example.com`;

  // Calculate duration based on join time
  const joinTimeDate = joinTimes[participant.id] || new Date();
  const durationMs = Date.now() - joinTimeDate.getTime();
  const durationMinutes = Math.floor(durationMs / (1000 * 60));

  // Determine status based on mute and camera state
  let status: Participant["status"] = "active";
  if (participant.isMuted) {
    status = "muted";
  } else if (participant.hasCamera && !participant.isCameraOn) {
    status = "video-off";
  }

  // Determine role
  const role: Participant["role"] = participant.isHost ? "host" : "participant";

  return {
    id: participant.id,
    name: participant.name,
    email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`,
    joinTime: new Date(participant.joinTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status,
    duration: `${durationMinutes}m`,
    speakingTime: "0m", // We don't have speaking time data yet
    role,
  };
};

const ParticipantPanel = ({
  meetingStatus = "in-progress",
  currentView = "list",
}: ParticipantPanelProps) => {
  const [view, setView] = useState<"list" | "grid" | "activity">(currentView);
  const [searchQuery, setSearchQuery] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joinTimes, setJoinTimes] = useState<Record<string, Date>>({});

  // Set up listener for real data from the content script
  useEffect(() => {
    // Store join times to calculate durations
    const participantJoinTimes: Record<string, Date> = {};

    // Listen for messages from the content script
    const handleMessage = (message: any) => {
      if (message.type === "PARTICIPANTS_UPDATED" && message.participants) {
        const updatedParticipants = message.participants.map(
          (p: GoogleMeetParticipant) => {
            // Record join time for new participants
            if (!participantJoinTimes[p.id]) {
              participantJoinTimes[p.id] = new Date();
            }
            return convertGoogleMeetParticipant(p, participantJoinTimes);
          },
        );
        setJoinTimes(participantJoinTimes);
        setParticipants(updatedParticipants);
      }
    };

    // Setup listener for Chrome extension messages
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    // For testing/development, if Chrome API isn't available
    if (!chrome?.runtime?.onMessage) {
      // Simulate initial data from content script
      const mockInitialData = {
        type: "PARTICIPANTS_UPDATED",
        participants: [
          {
            id: "user-1",
            name: "You",
            isHost: true,
            isMuted: false,
            hasCamera: true,
            isCameraOn: true,
            joinTime: new Date().toISOString(),
          },
          {
            id: "user-2",
            name: "John Smith",
            isHost: false,
            isMuted: true,
            hasCamera: true,
            isCameraOn: false,
            joinTime: new Date().toISOString(),
          },
        ],
      };

      handleMessage(mockInitialData);

      // Simulate updates every 10 seconds for dev environment
      const interval = setInterval(() => {
        const randomStatus = Math.random() > 0.5;
        mockInitialData.participants[1].isMuted = randomStatus;
        handleMessage(mockInitialData);
      }, 10000);

      return () => clearInterval(interval);
    }

    // Cleanup listener when component unmounts
    return () => {
      if (chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
    };
  }, []);

  // Request participant data on mount
  useEffect(() => {
    if (chrome?.runtime?.sendMessage) {
      // Request initial participant data from content script
      chrome.runtime.sendMessage({ type: "GET_PARTICIPANTS" }, (response) => {
        if (response && response.participants) {
          const initialJoinTimes: Record<string, Date> = {};
          response.participants.forEach((p: GoogleMeetParticipant) => {
            initialJoinTimes[p.id] = new Date(p.joinTime);
          });
          setJoinTimes(initialJoinTimes);

          const convertedParticipants = response.participants.map(
            (p: GoogleMeetParticipant) =>
              convertGoogleMeetParticipant(p, initialJoinTimes),
          );
          setParticipants(convertedParticipants);
        }
      });
    }
  }, []);

  const filteredParticipants = participants.filter(
    (participant) =>
      participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusIcon = (status: Participant["status"]) => {
    switch (status) {
      case "speaking":
        return <Mic className="h-4 w-4 text-green-500" />;
      case "muted":
        return <MicOff className="h-4 w-4 text-red-500" />;
      case "video-off":
        return <VideoOff className="h-4 w-4 text-red-500" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Video className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: Participant["status"]) => {
    switch (status) {
      case "speaking":
        return (
          <Badge variant="default" className="bg-green-500">
            Speaking
          </Badge>
        );
      case "muted":
        return (
          <Badge variant="outline" className="text-red-500 border-red-500">
            Muted
          </Badge>
        );
      case "video-off":
        return (
          <Badge variant="outline" className="text-red-500 border-red-500">
            Video Off
          </Badge>
        );
      case "inactive":
        return (
          <Badge
            variant="outline"
            className="text-yellow-500 border-yellow-500"
          >
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            Active
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: Participant["role"]) => {
    switch (role) {
      case "host":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Host
          </Badge>
        );
      case "co-host":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Co-host
          </Badge>
        );
      case "guest":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Guest
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Participant
          </Badge>
        );
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Participant Management</h2>
          <div className="flex items-center mt-1">
            <Badge
              variant="outline"
              className={`mr-2 ${meetingStatus === "in-progress" ? "text-green-500 border-green-500" : meetingStatus === "scheduled" ? "text-blue-500 border-blue-500" : "text-red-500 border-red-500"}`}
            >
              {meetingStatus === "in-progress"
                ? "Meeting in Progress"
                : meetingStatus === "scheduled"
                  ? "Meeting Scheduled"
                  : "Meeting Ended"}
            </Badge>
            <div className="flex items-center text-sm text-gray-400">
              <Users className="h-4 w-4 mr-1" />
              <span>{participants.length} Participants</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search participants..."
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className={`bg-gray-800 border-gray-700 ${view === "list" ? "text-blue-500 border-blue-500" : ""}`}
            onClick={() => setView("list")}
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`bg-gray-800 border-gray-700 ${view === "grid" ? "text-blue-500 border-blue-500" : ""}`}
            onClick={() => setView("grid")}
          >
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-1 h-1 bg-current rounded-sm"></div>
              <div className="w-1 h-1 bg-current rounded-sm"></div>
              <div className="w-1 h-1 bg-current rounded-sm"></div>
              <div className="w-1 h-1 bg-current rounded-sm"></div>
            </div>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`bg-gray-800 border-gray-700 ${view === "activity" ? "text-blue-500 border-blue-500" : ""}`}
            onClick={() => setView("activity")}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="bg-gray-800 mb-4">
          <TabsTrigger value="all">All ({participants.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({participants.filter((p) => p.status !== "inactive").length}
            )
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive (
            {participants.filter((p) => p.status === "inactive").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 overflow-hidden">
          {view === "list" && (
            <div className="rounded-md border border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800">
                    <TableHead className="text-gray-400">Participant</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Role</TableHead>
                    <TableHead className="text-gray-400">Join Time</TableHead>
                    <TableHead className="text-gray-400">Duration</TableHead>
                    <TableHead className="text-gray-400">
                      Speaking Time
                    </TableHead>
                    <TableHead className="text-gray-400 w-[80px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((participant) => (
                      <TableRow
                        key={participant.id}
                        className="border-gray-700 hover:bg-gray-800"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage
                                src={participant.avatar}
                                alt={participant.name}
                              />
                              <AvatarFallback className="bg-gray-700">
                                {participant.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {participant.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {participant.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(participant.status)}
                            <span>{getStatusBadge(participant.status)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(participant.role)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{participant.joinTime}</span>
                          </div>
                        </TableCell>
                        <TableCell>{participant.duration}</TableCell>
                        <TableCell>{participant.speakingTime}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-gray-800 border-gray-700"
                            >
                              <DropdownMenuItem className="text-white hover:bg-gray-700">
                                Mute participant
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-white hover:bg-gray-700">
                                Stop video
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-white hover:bg-gray-700">
                                Make host
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-white hover:bg-gray-700">
                                Remove participant
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <div className="text-gray-400">
                          No participants found or waiting for data...
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {view === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((participant) => (
                  <Card
                    key={participant.id}
                    className="bg-gray-800 border-gray-700 overflow-hidden"
                  >
                    <div className="relative">
                      <div className="absolute top-2 right-2 z-10 flex space-x-1">
                        <Badge
                          variant="outline"
                          className="bg-gray-900 bg-opacity-70 border-0"
                        >
                          {getStatusIcon(participant.status)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-gray-900 bg-opacity-70 border-0"
                        >
                          {participant.duration}
                        </Badge>
                      </div>
                      <div className="h-40 bg-gray-700 flex items-center justify-center">
                        <Avatar className="h-20 w-20">
                          <AvatarImage
                            src={participant.avatar}
                            alt={participant.name}
                          />
                          <AvatarFallback className="text-2xl bg-gray-600">
                            {participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium truncate">
                            {participant.name}
                          </h3>
                          <p className="text-xs text-gray-400 truncate">
                            {participant.email}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-gray-800 border-gray-700"
                          >
                            <DropdownMenuItem className="text-white hover:bg-gray-700">
                              Mute participant
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white hover:bg-gray-700">
                              Stop video
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white hover:bg-gray-700">
                              Make host
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white hover:bg-gray-700">
                              Remove participant
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getRoleBadge(participant.role)}
                        {getStatusBadge(participant.status)}
                      </div>
                      <div className="mt-3 text-xs text-gray-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Joined at {participant.joinTime}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex items-center justify-center h-40 text-gray-400">
                  No participants found or waiting for data...
                </div>
              )}
            </div>
          )}

          {view === "activity" && (
            <Card className="bg-gray-800 border-gray-700 h-full overflow-hidden">
              <CardHeader>
                <CardTitle>Participant Activity</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                {filteredParticipants.length > 0 ? (
                  <div className="space-y-4">
                    {filteredParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className="p-3 bg-gray-700 rounded-md flex items-start space-x-3"
                      >
                        <Avatar>
                          <AvatarImage
                            src={participant.avatar}
                            alt={participant.name}
                          />
                          <AvatarFallback className="bg-gray-600">
                            {participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <span className="font-medium">
                                {participant.name}
                              </span>{" "}
                              <span className="text-sm text-gray-400">
                                ({participant.role})
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {participant.joinTime}
                            </span>
                          </div>
                          <p className="text-sm mt-1">
                            {participant.status === "speaking"
                              ? "Currently speaking"
                              : participant.status === "muted"
                                ? "Currently muted"
                                : participant.status === "video-off"
                                  ? "Video turned off"
                                  : participant.status === "inactive"
                                    ? "Inactive for some time"
                                    : "Active in the meeting"}
                          </p>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                            <div>Duration: {participant.duration}</div>
                            <div>Speaking time: {participant.speakingTime}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-gray-400">
                    No participants found or waiting for data...
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="flex-1 overflow-hidden">
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Active participants view</p>
              <p className="text-sm mt-1">
                Showing{" "}
                {participants.filter((p) => p.status !== "inactive").length}{" "}
                active participants
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="flex-1 overflow-hidden">
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inactive participants view</p>
              <p className="text-sm mt-1">
                Showing{" "}
                {participants.filter((p) => p.status === "inactive").length}{" "}
                inactive participants
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParticipantPanel;
