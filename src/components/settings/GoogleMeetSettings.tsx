import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getGoogleMeetClient } from "@/lib/googleMeetApi";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface GoogleMeetSettingsProps {
  onSave?: (settings: {
    apiKey: string;
    autoConnect: boolean;
    autoRecord: boolean;
  }) => void;
}

const GoogleMeetSettings = ({ onSave }: GoogleMeetSettingsProps) => {
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("googleMeetApiKey") || "",
  );
  const [autoConnect, setAutoConnect] = useState(
    localStorage.getItem("googleMeetAutoConnect") === "true",
  );
  const [autoRecord, setAutoRecord] = useState(
    localStorage.getItem("googleMeetAutoRecord") === "true",
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already connected
    const client = getGoogleMeetClient();
    setIsConnected(client.isConnected());
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const client = getGoogleMeetClient();
      const success = await client.initialize(apiKey || "demo-key");

      if (success) {
        setIsConnected(true);
        localStorage.setItem("googleMeetApiKey", apiKey);
        localStorage.setItem("googleMeetAutoConnect", String(autoConnect));
        localStorage.setItem("googleMeetAutoRecord", String(autoRecord));

        if (onSave) {
          onSave({
            apiKey,
            autoConnect,
            autoRecord,
          });
        }
      } else {
        setError("Failed to connect to Google Meet API");
      }
    } catch (err) {
      setError("An error occurred while connecting to Google Meet API");
      console.error("Google Meet connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    const client = getGoogleMeetClient();
    client.disconnect();
    setIsConnected(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Google Meet Integration</CardTitle>
          {isConnected ? (
            <Badge variant="default" className="bg-green-600">
              Connected
            </Badge>
          ) : (
            <Badge variant="outline">Disconnected</Badge>
          )}
        </div>
        <CardDescription>
          Configure the integration with Google Meet for automatic recording
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {isConnected && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-md flex items-start space-x-2">
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>Successfully connected to Google Meet API</div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Google Meet API key"
            disabled={isConnected}
          />
          <p className="text-xs text-muted-foreground">
            {isConnected
              ? "API key is currently in use"
              : "For production use, enter your Google Meet API key. For testing, you can leave this empty."}
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-connect">Auto-connect on startup</Label>
              <p className="text-xs text-muted-foreground">
                Automatically connect to Google Meet when the application starts
              </p>
            </div>
            <Switch
              id="auto-connect"
              checked={autoConnect}
              onCheckedChange={setAutoConnect}
              disabled={isConnected}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-record">Auto-record meetings</Label>
              <p className="text-xs text-muted-foreground">
                Automatically start recording when a meeting begins
              </p>
            </div>
            <Switch
              id="auto-record"
              checked={autoRecord}
              onCheckedChange={setAutoRecord}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {isConnected ? (
          <Button variant="outline" onClick={handleDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default GoogleMeetSettings;
