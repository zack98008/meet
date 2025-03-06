import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { useGoogleMeetRecording } from "@/hooks/useGoogleMeetRecording";
import { useRecordings } from "@/hooks/useRecordings";
import { Recording as RecordingType } from "@/types/recording";
import { getRecordingFileUrl } from "@/lib/api";
import MeetingUrlInput from "../MeetingUrlInput";
import ExtensionInstallPrompt from "../ExtensionInstallPrompt";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import {
  Play,
  Pause,
  StopCircle,
  Clock,
  Settings,
  Download,
  Trash2,
  Info,
  List,
  Grid,
  Calendar,
  Filter,
  MoreVertical,
} from "lucide-react";

interface RecordingPanelProps {
  meetingStatus?: "not-started" | "in-progress" | "ended";
}

const RecordingPanel = ({
  meetingStatus: externalMeetingStatus,
}: RecordingPanelProps) => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedRecording, setSelectedRecording] =
    useState<RecordingType | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const {
    recording,
    paused,
    time,
    recordingData,
    meetingTitle,
    setMeetingTitle,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    saveRecording,
    meetingStatus,
    currentMeetingId,
    autoRecordEnabled,
    setAutoRecordEnabled,
    meetingMetadata,
    recordingError,
    startMeetingRecording,
    stopMeetingRecording,
  } = useGoogleMeetRecording();

  const {
    recordings,
    recentRecordings,
    processingRecordings,
    loading,
    error,
    deleteRecording,
  } = useRecordings();

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRecordingToggle = async () => {
    if (recording) {
      if (paused) {
        resumeRecording();
      } else {
        pauseRecording();
      }
    } else {
      if (currentMeetingId) {
        await startMeetingRecording();
      } else {
        startRecording();
      }
    }
  };

  const handleStopRecording = async () => {
    if (currentMeetingId) {
      await stopMeetingRecording();
    } else {
      stopRecording();
    }
    setShowSaveDialog(true);
  };

  const handleSaveRecording = async () => {
    await saveRecording();
    setShowSaveDialog(false);
  };

  const handleDownload = async (recording: RecordingType) => {
    if (!recording.storage_path) return;

    try {
      const url = await getRecordingFileUrl(recording.storage_path);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading recording:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecording(id);
    } catch (error) {
      console.error("Error deleting recording:", error);
    }
  };

  // Get the appropriate recordings based on the active tab
  const getTabRecordings = () => {
    switch (activeTab) {
      case "recent":
        return recentRecordings;
      case "processing":
        return processingRecordings;
      default:
        return recordings;
    }
  };

  const displayedRecordings = getTabRecordings();

  const getStatusColor = (status: RecordingType["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "";
    }
  };

  return (
    <div className="w-full h-full bg-background p-4 flex flex-col space-y-4">
      {meetingStatus === "not-started" ? (
        <>
          <ExtensionInstallPrompt />
          <div className="mt-4">
            <MeetingUrlInput
              onMeetingConnected={(meetingId, title) => {
                setCurrentMeetingId(meetingId);
                setMeetingTitle(title);
                setMeetingStatus("in-progress");
              }}
            />
          </div>
        </>
      ) : (
        <Card className="w-full bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recording Controls</CardTitle>
              <Badge
                variant={
                  meetingStatus === "in-progress" ? "default" : "secondary"
                }
                className="text-xs"
              >
                {meetingStatus === "not-started"
                  ? "Meeting Not Started"
                  : meetingStatus === "in-progress"
                    ? "Meeting In Progress"
                    : "Meeting Ended"}
              </Badge>
            </div>
            <CardDescription>
              Control and manage your meeting recordings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-6">
              {/* Recording Status */}
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Recording Status</span>
                  <div className="flex items-center space-x-2">
                    {recordingError && (
                      <span className="text-xs text-red-500">
                        {recordingError}
                      </span>
                    )}
                    <Badge
                      variant={recording ? "default" : "outline"}
                      className={recording ? "bg-red-500" : ""}
                    >
                      {recording ? "Recording" : "Idle"}
                    </Badge>
                  </div>
                </div>
                {recording && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTime(time)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Recording in progress...
                      </span>
                    </div>
                    <Progress value={75} className="h-1" />
                  </div>
                )}
              </div>

              {/* Recording Controls */}
              <div className="flex justify-center space-x-4">
                {!recording ? (
                  <Button
                    onClick={handleRecordingToggle}
                    disabled={meetingStatus !== "in-progress"}
                    className="bg-red-500 hover:bg-red-600 text-white flex items-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleRecordingToggle}
                      className="flex items-center"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleStopRecording}
                      className="flex items-center"
                    >
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>

              {/* Recording Settings */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Auto-record meetings
                  </span>
                  <Switch
                    checked={autoRecordEnabled}
                    onCheckedChange={setAutoRecordEnabled}
                  />
                </div>

                {meetingMetadata && (
                  <div className="bg-muted/30 p-2 rounded-md text-xs">
                    <div className="font-medium mb-1">Current Meeting:</div>
                    <div>
                      <span className="text-muted-foreground">Title:</span>{" "}
                      {meetingMetadata.title}
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID:</span>{" "}
                      {meetingMetadata.meetingId}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Started:</span>{" "}
                      {new Date(meetingMetadata.startTime).toLocaleTimeString()}
                    </div>
                    {meetingMetadata.hostEmail && (
                      <div>
                        <span className="text-muted-foreground">Host:</span>{" "}
                        {meetingMetadata.hostEmail}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recordings List */}
      <Card className="w-full flex-1 overflow-hidden bg-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Recordings</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-muted" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-muted" : ""}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            View and manage your saved recordings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all" onClick={() => setActiveTab("all")}>
                All Recordings
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                onClick={() => setActiveTab("recent")}
              >
                Recent
              </TabsTrigger>
              <TabsTrigger
                value="processing"
                onClick={() => setActiveTab("processing")}
              >
                Processing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {viewMode === "list" ? (
                <div className="rounded-md border">
                  <div className="flex items-center p-3 bg-muted/50 text-sm font-medium">
                    <div className="w-5/12">Title</div>
                    <div className="w-2/12 text-center">Date</div>
                    <div className="w-1/12 text-center">Duration</div>
                    <div className="w-1/12 text-center">Size</div>
                    <div className="w-2/12 text-center">Status</div>
                    <div className="w-1/12 text-right">Actions</div>
                  </div>
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Loading recordings...
                    </div>
                  ) : error ? (
                    <div className="p-8 text-center text-red-500">
                      Error loading recordings
                    </div>
                  ) : displayedRecordings.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No recordings found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {displayedRecordings.map((recording) => (
                        <div
                          key={recording.id}
                          className="flex items-center p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="w-5/12 font-medium">
                            {recording.title}
                          </div>
                          <div className="w-2/12 text-center text-sm text-muted-foreground">
                            {new Date(recording.date).toLocaleDateString()}
                          </div>
                          <div className="w-1/12 text-center text-sm text-muted-foreground">
                            {recording.duration}
                          </div>
                          <div className="w-1/12 text-center text-sm text-muted-foreground">
                            {recording.size}
                          </div>
                          <div className="w-2/12 text-center">
                            <Badge
                              className={getStatusColor(recording.status)}
                              variant="outline"
                            >
                              {recording.status}
                            </Badge>
                          </div>
                          <div className="w-1/12 text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    setSelectedRecording(recording)
                                  }
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Recording Options</DialogTitle>
                                  <DialogDescription>
                                    Manage your recording:{" "}
                                    {selectedRecording?.title}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                  >
                                    <Info className="mr-2 h-4 w-4" />
                                    View Details
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() =>
                                      selectedRecording &&
                                      handleDownload(selectedRecording)
                                    }
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Recording
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-destructive hover:text-destructive"
                                    onClick={() =>
                                      selectedRecording &&
                                      handleDelete(selectedRecording.id)
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Recording
                                  </Button>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline">Close</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Loading recordings...
                    </div>
                  ) : error ? (
                    <div className="p-8 text-center text-red-500">
                      Error loading recordings
                    </div>
                  ) : displayedRecordings.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No recordings found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayedRecordings.map((recording) => (
                        <Card key={recording.id} className="overflow-hidden">
                          <div className="h-32 bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center">
                            <Play className="h-12 w-12 text-white opacity-70" />
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">
                                  {recording.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(
                                    recording.date,
                                  ).toLocaleDateString()}{" "}
                                  • {recording.duration}
                                </p>
                              </div>
                              <Badge
                                className={getStatusColor(recording.status)}
                                variant="outline"
                              >
                                {recording.status}
                              </Badge>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between p-4 pt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(recording)}
                            >
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              {viewMode === "list" ? (
                <div className="rounded-md border">
                  <div className="flex items-center p-3 bg-muted/50 text-sm font-medium">
                    <div className="w-5/12">Title</div>
                    <div className="w-2/12 text-center">Date</div>
                    <div className="w-1/12 text-center">Duration</div>
                    <div className="w-1/12 text-center">Size</div>
                    <div className="w-2/12 text-center">Status</div>
                    <div className="w-1/12 text-right">Actions</div>
                  </div>
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Loading recordings...
                    </div>
                  ) : error ? (
                    <div className="p-8 text-center text-red-500">
                      Error loading recordings
                    </div>
                  ) : recentRecordings.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No recent recordings found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {recentRecordings.map((recording) => (
                        <div
                          key={recording.id}
                          className="flex items-center p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="w-5/12 font-medium">
                            {recording.title}
                          </div>
                          <div className="w-2/12 text-center text-sm text-muted-foreground">
                            {new Date(recording.date).toLocaleDateString()}
                          </div>
                          <div className="w-1/12 text-center text-sm text-muted-foreground">
                            {recording.duration}
                          </div>
                          <div className="w-1/12 text-center text-sm text-muted-foreground">
                            {recording.size}
                          </div>
                          <div className="w-2/12 text-center">
                            <Badge
                              className={getStatusColor(recording.status)}
                              variant="outline"
                            >
                              {recording.status}
                            </Badge>
                          </div>
                          <div className="w-1/12 text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    setSelectedRecording(recording)
                                  }
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Recording Options</DialogTitle>
                                  <DialogDescription>
                                    Manage your recording:{" "}
                                    {selectedRecording?.title}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                  >
                                    <Info className="mr-2 h-4 w-4" />
                                    View Details
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() =>
                                      selectedRecording &&
                                      handleDownload(selectedRecording)
                                    }
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Recording
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-destructive hover:text-destructive"
                                    onClick={() =>
                                      selectedRecording &&
                                      handleDelete(selectedRecording.id)
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Recording
                                  </Button>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline">Close</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentRecordings.map((recording) => (
                    <Card key={recording.id} className="overflow-hidden">
                      <div className="h-32 bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center">
                        <Play className="h-12 w-12 text-white opacity-70" />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{recording.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(recording.date).toLocaleDateString()} •{" "}
                              {recording.duration}
                            </p>
                          </div>
                          <Badge
                            className={getStatusColor(recording.status)}
                            variant="outline"
                          >
                            {recording.status}
                          </Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between p-4 pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(recording)}
                        >
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="processing" className="space-y-4">
              {viewMode === "list" ? (
                <div className="rounded-md border">
                  <div className="flex items-center p-3 bg-muted/50 text-sm font-medium">
                    <div className="w-5/12">Title</div>
                    <div className="w-2/12 text-center">Date</div>
                    <div className="w-1/12 text-center">Duration</div>
                    <div className="w-1/12 text-center">Size</div>
                    <div className="w-2/12 text-center">Status</div>
                    <div className="w-1/12 text-right">Actions</div>
                  </div>
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Loading recordings...
                    </div>
                  ) : error ? (
                    <div className="p-8 text-center text-red-500">
                      Error loading recordings
                    </div>
                  ) : processingRecordings.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No processing recordings found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {processingRecordings.map((recording) => (
                        <div
                          key={recording.id}
                          className="flex items-center p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="w-5/12 font-medium">
                            {recording.title}
                          </div>
                          <div className="w-2/12 text-center text-sm text-muted-foreground">
                            {new Date(recording.date).toLocaleDateString()}
                          </div>
                          <div className="w-1/12 text-center text-sm text-muted-foreground">
                            {recording.duration}
                          </div>
                          <div className="w-1/12 text-center text-sm text-muted-foreground">
                            {recording.size}
                          </div>
                          <div className="w-2/12 text-center">
                            <Badge
                              className={getStatusColor(recording.status)}
                              variant="outline"
                            >
                              {recording.status}
                            </Badge>
                          </div>
                          <div className="w-1/12 text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    setSelectedRecording(recording)
                                  }
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Recording Options</DialogTitle>
                                  <DialogDescription>
                                    Manage your recording:{" "}
                                    {selectedRecording?.title}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                  >
                                    <Info className="mr-2 h-4 w-4" />
                                    View Details
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-destructive hover:text-destructive"
                                    onClick={() =>
                                      selectedRecording &&
                                      handleDelete(selectedRecording.id)
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Recording
                                  </Button>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline">Close</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {processingRecordings.map((recording) => (
                    <Card key={recording.id} className="overflow-hidden">
                      <div className="h-32 bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center">
                        <Play className="h-12 w-12 text-white opacity-70" />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{recording.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(recording.date).toLocaleDateString()} •{" "}
                              {recording.duration}
                            </p>
                          </div>
                          <Badge
                            className={getStatusColor(recording.status)}
                            variant="outline"
                          >
                            {recording.status}
                          </Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between p-4 pt-0">
                        <Button variant="outline" size="sm" disabled>
                          <Download className="h-4 w-4 mr-1" /> Processing
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-4 right-4"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recording Settings</DialogTitle>
            <DialogDescription>
              Configure your recording preferences
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto-record meetings</span>
              <Switch
                checked={autoRecordEnabled}
                onCheckedChange={setAutoRecordEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                High quality recording
              </span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Save to cloud automatically
              </span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Generate transcript</span>
              <Switch />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Recording Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Recording</DialogTitle>
            <DialogDescription>
              Enter a title for your recording before saving it
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Recording Title
              </label>
              <Input
                id="title"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Enter recording title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRecording}>Save Recording</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordingPanel;
