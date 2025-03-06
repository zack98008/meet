import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Video,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  activeSection?: "recording" | "participants" | "analytics" | "settings";
  onSectionChange?: (section: string) => void;
}

const Sidebar = ({
  className,
  activeSection = "recording",
  onSectionChange = () => {},
}: SidebarProps) => {
  const navItems = [
    {
      id: "recording",
      label: "Recording",
      icon: <Video className="h-5 w-5" />,
      tooltip: "Control meeting recordings",
    },
    {
      id: "participants",
      label: "Participants",
      icon: <Users className="h-5 w-5" />,
      tooltip: "Track and manage participants",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      tooltip: "View meeting analytics",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      tooltip: "Configure application settings",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-full w-[250px] bg-gray-900 text-white border-r border-gray-800",
        className,
      )}
    >
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 rounded-md p-1">
            <Video className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Meet Enhancer</h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left mb-1",
                    activeSection === item.id
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "hover:bg-gray-800",
                  )}
                  onClick={() => onSectionChange(item.id)}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-left hover:bg-gray-800"
              >
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5" />
                  <span className="ml-3">Help & Support</span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Get help and support</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-left hover:bg-gray-800"
              >
                <div className="flex items-center">
                  <LogOut className="h-5 w-5" />
                  <span className="ml-3">Logout</span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Sign out of your account
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user123"
              alt="User avatar"
              className="h-10 w-10 rounded-full bg-gray-700"
            />
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-900"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-gray-400 truncate">
              john.doe@example.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
