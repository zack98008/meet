import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import GoogleMeetSettings from "./GoogleMeetSettings";
import { supabase } from "@/lib/supabase";

interface SettingsPanelProps {
  onSettingsSaved?: () => void;
}

const SettingsPanel = ({ onSettingsSaved }: SettingsPanelProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [highQuality, setHighQuality] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [generateTranscript, setGenerateTranscript] = useState(false);
  const [maxRecordingLength, setMaxRecordingLength] = useState(60); // minutes
  const [saveLocation, setSaveLocation] = useState("cloud");
  const [userEmail, setUserEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Get current user email
  React.useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    };
    getUser();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // In a real app, save settings to user preferences in database
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      // Save to local storage for demo purposes
      localStorage.setItem("recordingHighQuality", String(highQuality));
      localStorage.setItem("recordingAutoSave", String(autoSave));
      localStorage.setItem(
        "recordingGenerateTranscript",
        String(generateTranscript),
      );
      localStorage.setItem("recordingMaxLength", String(maxRecordingLength));
      localStorage.setItem("recordingSaveLocation", saveLocation);

      setSaveSuccess(true);
      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-background p-4 flex flex-col space-y-4 overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your recording and integration preferences
        </p>
      </div>

      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable dark mode for the application
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable desktop notifications
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-start on system boot</Label>
                  <p className="text-xs text-muted-foreground">
                    Launch application when your system starts
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recording" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recording Settings</CardTitle>
              <CardDescription>
                Configure recording quality and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-quality">High Quality Recording</Label>
                  <p className="text-xs text-muted-foreground">
                    Record in high quality (uses more storage)
                  </p>
                </div>
                <Switch
                  id="high-quality"
                  checked={highQuality}
                  onCheckedChange={setHighQuality}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">Auto-save Recordings</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save recordings when stopped
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="generate-transcript">
                    Generate Transcript
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically generate transcript for recordings
                  </p>
                </div>
                <Switch
                  id="generate-transcript"
                  checked={generateTranscript}
                  onCheckedChange={setGenerateTranscript}
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Recording Length (minutes)</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[maxRecordingLength]}
                    min={10}
                    max={180}
                    step={10}
                    onValueChange={(value) => setMaxRecordingLength(value[0])}
                    className="flex-1"
                  />
                  <span className="w-12 text-center">{maxRecordingLength}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum length for a single recording session
                </p>
              </div>

              <div className="space-y-2">
                <Label>Save Location</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={saveLocation === "local" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSaveLocation("local")}
                    className="flex-1"
                  >
                    Local Storage
                  </Button>
                  <Button
                    variant={saveLocation === "cloud" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSaveLocation("cloud")}
                    className="flex-1"
                  >
                    Cloud Storage
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose where to save your recordings
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <GoogleMeetSettings />

          <Card>
            <CardHeader>
              <CardTitle>Other Integrations</CardTitle>
              <CardDescription>
                Connect with other services and platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Zoom</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with Zoom for meeting recording
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Microsoft Teams</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with Microsoft Teams for meeting recording
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Google Drive</h3>
                  <p className="text-sm text-muted-foreground">
                    Save recordings directly to Google Drive
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account and profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  disabled
                />
              </div>

              <div className="pt-2">
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
              </div>

              <div className="pt-2">
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline">Cancel</Button>
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="min-w-[100px]"
        >
          {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
