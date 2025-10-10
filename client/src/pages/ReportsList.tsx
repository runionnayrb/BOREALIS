import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReportCard from "@/components/ReportCard";
import EmptyState from "@/components/EmptyState";
import { FileText } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function ReportsList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const mockReports = [
    { id: "1", title: "High Dive Training Report", date: "Thursday, October 9, 2025", trainingsCount: 3 },
    { id: "2", title: "Wheel Act Training", date: "Wednesday, October 8, 2025", trainingsCount: 2 },
    { id: "3", title: "House Sync Rehearsal", date: "Tuesday, October 7, 2025", trainingsCount: 1 },
  ];

  const filteredReports = mockReports.filter((report) =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Training Reports</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track all training documentation
            </p>
          </div>
          <Button onClick={() => setLocation("/new-report")} data-testid="button-create-report" className="hidden md:flex">
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-reports"
          />
        </div>

        {filteredReports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports found"
            description="Try adjusting your search or create a new report"
            actionLabel="Create Report"
            onAction={() => setLocation("/new-report")}
          />
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                {...report}
                onEdit={() => setLocation(`/report/${report.id}`)}
                onDelete={() => console.log("Delete", report.id)}
                onExport={() => console.log("Export", report.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
