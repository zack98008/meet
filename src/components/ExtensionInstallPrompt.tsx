import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, Download, Chrome, ExternalLink, X } from "lucide-react";

interface ExtensionInstallPromptProps {
  onDismiss?: () => void;
}

const ExtensionInstallPrompt: React.FC<ExtensionInstallPromptProps> = ({
  onDismiss,
}) => {
  const handleInstallClick = () => {
    // In production, this would link to the Chrome Web Store
    window.open(
      "https://chrome.google.com/webstore/detail/google-meet-enhancement-tool/extension-id-here",
      "_blank",
    );
  };

  const handleDownloadClick = () => {
    // For development/testing, provide direct download of the extension package
    // This would be a link to a hosted .zip file of the extension
    const link = document.createElement("a");
    link.href = "/extensions/google-meet-enhancement-tool.zip";
    link.download = "google-meet-enhancement-tool.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full bg-card border-yellow-600/30">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <CardTitle>Browser Extension Required</CardTitle>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          To enable Google Meet integration, you need to install our browser
          extension
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted/30 p-3 rounded-md text-sm">
            <p>
              The Google Meet Enhancement Tool browser extension allows this app
              to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>Detect when you're in a Google Meet session</li>
              <li>Record audio from your meetings (with your permission)</li>
              <li>Track participant information and engagement</li>
              <li>Generate meeting analytics and transcripts</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 gap-2" onClick={handleInstallClick}>
              <Chrome className="h-4 w-4" />
              Install from Chrome Web Store
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleDownloadClick}
            >
              <Download className="h-4 w-4" />
              Download Extension (.zip)
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            After installing the extension, refresh this page to connect to
            Google Meet.
            <a
              href="/help/extension-setup"
              className="text-blue-500 hover:text-blue-400 ml-1 inline-flex items-center"
            >
              View installation guide
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtensionInstallPrompt;
