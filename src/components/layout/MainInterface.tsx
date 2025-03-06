import React, { useState } from "react";
import Sidebar from "./Sidebar";
import RecordingPanel from "../recording/RecordingPanel";
import ParticipantPanel from "../participants/ParticipantPanel";
import AnalyticsPanel from "../analytics/AnalyticsPanel";
import SettingsPanel from "../settings/SettingsPanel";
import { useAuth, AuthProvider } from "../auth/AuthProvider";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

interface MainInterfaceProps {
  className?: string;
  defaultSection?: "recording" | "participants" | "analytics" | "settings";
}

const MainInterfaceContent = ({
  className = "",
  defaultSection = "recording",
}: MainInterfaceProps) => {
  const [activeSection, setActiveSection] = useState<string>(defaultSection);
  const { user, signOut } = useAuth();

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "recording":
        return <RecordingPanel />;
      case "participants":
        return <ParticipantPanel />;
      case "analytics":
        return <AnalyticsPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <RecordingPanel />;
    }
  };

  return (
    <div className={`flex h-full w-full bg-gray-950 ${className}`}>
      <Sidebar
        activeSection={activeSection as any}
        onSectionChange={handleSectionChange}
      />
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}

        {/* User info and logout button */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          {user?.email && (
            <span className="text-sm text-gray-400">{user.email}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 border-gray-700"
            onClick={() => signOut()}
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

const MainInterface = (props: MainInterfaceProps) => {
  return (
    <AuthProvider>
      <MainInterfaceContent {...props} />
    </AuthProvider>
  );
};

export default MainInterface;
