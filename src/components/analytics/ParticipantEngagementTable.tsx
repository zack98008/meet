import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  SortAsc,
  SortDesc,
} from "lucide-react";

interface ParticipantData {
  id: string;
  name: string;
  email: string;
  joinTime: string;
  leaveTime: string;
  duration: string;
  speakingTime: string;
  engagementScore: number;
}

interface ParticipantEngagementTableProps {
  data?: ParticipantData[];
  title?: string;
  description?: string;
}

const ParticipantEngagementTable = ({
  data = [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      joinTime: "10:00 AM",
      leaveTime: "11:30 AM",
      duration: "1h 30m",
      speakingTime: "25m",
      engagementScore: 85,
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      joinTime: "10:05 AM",
      leaveTime: "11:30 AM",
      duration: "1h 25m",
      speakingTime: "35m",
      engagementScore: 92,
    },
    {
      id: "3",
      name: "Robert Johnson",
      email: "robert.j@example.com",
      joinTime: "10:10 AM",
      leaveTime: "11:15 AM",
      duration: "1h 05m",
      speakingTime: "15m",
      engagementScore: 68,
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.d@example.com",
      joinTime: "10:00 AM",
      leaveTime: "11:30 AM",
      duration: "1h 30m",
      speakingTime: "28m",
      engagementScore: 88,
    },
    {
      id: "5",
      name: "Michael Wilson",
      email: "michael.w@example.com",
      joinTime: "10:15 AM",
      leaveTime: "11:20 AM",
      duration: "1h 05m",
      speakingTime: "12m",
      engagementScore: 62,
    },
  ],
  title = "Participant Engagement",
  description = "Detailed metrics for meeting participants including join/leave times and engagement scores.",
}: ParticipantEngagementTableProps) => {
  const [sortField, setSortField] = useState<keyof ParticipantData>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof ParticipantData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (sortField === "engagementScore") {
      return sortDirection === "asc"
        ? a[sortField] - b[sortField]
        : b[sortField] - a[sortField];
    }

    const aValue = String(a[sortField]).toLowerCase();
    const bValue = String(b[sortField]).toLowerCase();

    return sortDirection === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const getSortIcon = (field: keyof ParticipantData) => {
    if (field !== sortField) return null;
    return sortDirection === "asc" ? (
      <SortAsc className="h-4 w-4 ml-1" />
    ) : (
      <SortDesc className="h-4 w-4 ml-1" />
    );
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="w-full bg-background rounded-lg border border-border shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>Meeting participant engagement data</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Participant {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleSort("joinTime")}
              >
                <div className="flex items-center">
                  Join Time {getSortIcon("joinTime")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleSort("leaveTime")}
              >
                <div className="flex items-center">
                  Leave Time {getSortIcon("leaveTime")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleSort("duration")}
              >
                <div className="flex items-center">
                  Duration {getSortIcon("duration")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleSort("speakingTime")}
              >
                <div className="flex items-center">
                  Speaking Time {getSortIcon("speakingTime")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleSort("engagementScore")}
              >
                <div className="flex items-center">
                  Engagement {getSortIcon("engagementScore")}
                </div>
              </TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{participant.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {participant.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{participant.joinTime}</TableCell>
                <TableCell>{participant.leaveTime}</TableCell>
                <TableCell>{participant.duration}</TableCell>
                <TableCell>{participant.speakingTime}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEngagementColor(participant.engagementScore)}`}
                  >
                    {participant.engagementScore}%
                  </span>
                </TableCell>
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
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>Export data</DropdownMenuItem>
                      <DropdownMenuItem>Send report</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ParticipantEngagementTable;
