import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, Link as LinkIcon } from "lucide-react";
import { getGoogleMeetClient } from "@/lib/googleMeetApi";

interface MeetingUrlInputProps {
  onMeetingConnected: (meetingId: string, meetingTitle: string) => void;
}

const MeetingUrlInput: React.FC<MeetingUrlInputProps> = ({
  onMeetingConnected,
}) => {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractMeetingInfo = (url: string) => {
    try {
      // Extract meeting ID from Google Meet URL
      // Format: https://meet.google.com/abc-defg-hij
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes("meet.google.com")) {
        throw new Error("Invalid Google Meet URL");
      }

      // Extract the meeting code from the path
      const meetingCode = urlObj.pathname.replace("/", "");
      if (!meetingCode || !/^[a-z]+-[a-z]+-[a-z]+$/.test(meetingCode)) {
        throw new Error("Invalid meeting code format");
      }

      return {
        meetingId: meetingCode,
        meetingCode: meetingCode,
        title: `Google Meet: ${meetingCode}`,
      };
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error("Invalid meeting URL");
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!meetingUrl.trim()) {
        throw new Error("Please enter a Google Meet URL");
      }

      const meetingInfo = extractMeetingInfo(meetingUrl);

      // Get the Google Meet client
      const client = getGoogleMeetClient();

      // In a real implementation, this would connect to the actual meeting
      // For now, we'll simulate a successful connection
      const connected = await client.connectToMeeting(
        meetingInfo.meetingId,
        meetingInfo.title,
      );

      if (connected) {
        onMeetingConnected(meetingInfo.meetingId, meetingInfo.title);
      } else {
        throw new Error("Failed to connect to the meeting");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle>Connect to Google Meet</CardTitle>
        <CardDescription>
          Enter the URL of your Google Meet session to connect and enable
          recording
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleConnect}
            disabled={isConnecting || !meetingUrl.trim()}
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          Paste the URL from your browser's address bar when in a Google Meet
          session
        </p>
      </CardContent>
    </Card>
  );
};

export default MeetingUrlInput;
