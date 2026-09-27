"use client";

import { Card, LoadingState, ErrorState, Skeleton } from "@/components/ui";
import { useGetCalendarEventsQuery, useGetProjectsQuery, useGetAuthUserQuery, useGetOrganizationQuery } from "@/state/api";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { ChevronLeft, ChevronRight, Today, Filter, Calendar as CalendarIcon, ChevronDown, Search } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subWeeks, subMonths, isSameDay } from "date-fns";

const CalendarPage = () => {
  const dispatch = useAppDispatch();
  const { data: currentUser } = useGetAuthUserQuery({});
  const orgId = currentUser?.userDetails?.organizationMemberships?.[0]?.organizationId ?? 0;
  const activeProjectId = useAppSelector((state) => state.global.activeProjectId);
  const allProjectsSelected = useAppSelector((state) => state.global.allProjectsSelected);
  const { data: projects = [] } = useGetProjectsQuery();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listMonth">("dayGridMonth");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<number | null>(activeProjectId && !allProjectsSelected ? activeProjectId : null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: events = [], isLoading, isError, refetch } = useGetCalendarEventsQuery({
    organizationId: orgId,
    projectId: selectedProjectFilter || undefined,
    startDate: format(startOfMonth(currentDate), "yyyy-MM-dd"),
    endDate: format(endOfMonth(currentDate), "yyyy-MM-dd"),
  });

  // Fetch all event types on mount
  useEffect(() => {
    if (events.length > 0) {
      const types = [...new Set(events.map((e: any) => e.type).filter(Boolean))];
      setEventTypes(types);
    }
  }, [events]);

  // Refetch when filters change
  useEffect(() => {
    refetch();
  }, [currentDate, selectedProjectFilter, refetch]);

  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events;
    const term = searchTerm.toLowerCase();
    return events.filter((e: any) => 
      e.title?.toLowerCase().includes(term) ||
      e.description?.toLowerCase().includes(term)
    );
  }, [events, searchTerm]);

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      MEETING: "#3b82f6",
      HIGH_PRIORITY_MEETING: "#ef4444",
      LOW_PRIORITY_MEETING: "#94a3b8",
      SPRINT_START: "#8b5cf6",
      SPRINT_END: "#a855f7",
      TASK_DEADLINE: "#f97316",
      PROJECT_DEADLINE: "#ef4444",
      MILESTONE: "#14b8a6",
      OTHER: "#64748b",
    };
    return colors[type] || colors.OTHER;
  };

  const getEventClassNames = (type: string) => {
    if (type === "HIGH_PRIORITY_MEETING") return "fc-event-high-priority";
    if (type === "TASK_DEADLINE" || type === "PROJECT_DEADLINE") return "fc-event-deadline";
    return "";
  };

  const handleEventClick = (info: any) => {
    const event = info.event;
    if (event.extendedProps.taskId) {
      window.location.href = `/projects/${activeProjectId}/tasks/${event.extendedProps.taskId}`;
    } else if (event.extendedProps.sprintId) {
      window.location.href = `/projects/${activeProjectId}/sprints/${event.extendedProps.sprintId}`;
    } else if (event.extendedProps.milestoneId) {
      window.location.href = `/projects/${activeProjectId}/milestones/${event.extendedProps.milestoneId}`;
    } else if (event.extendedProps.projectId) {
      window.location.href = `/projects/${event.extendedProps.projectId}`;
    }
  };

  const formatEventTime = (event: any) => {
    if (event.allDay) return "All day";
    const start = format(new Date(event.start), "HH:mm");
    const end = event.end ? format(new Date(event.end), "HH:mm") : "";
    return end ? `${start} - ${end}` : start;
  };

  const getViewTitle = () => {
    switch (view) {
      case "dayGridMonth":
        return format(currentDate, "MMMM yyyy");
      case "timeGridWeek":
        return `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`;
      case "timeGridDay":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "listMonth":
        return format(currentDate, "MMMM yyyy");
      default:
        return format(currentDate, "MMMM yyyy");
    }
  };

  const navigate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      switch (view) {
        case "dayGridMonth":
          setCurrentDate(subMonths(currentDate, 1));
          break;
        case "timeGridWeek":
          setCurrentDate(subWeeks(currentDate, 1));
          break;
        case "timeGridDay":
          setCurrentDate(addDays(currentDate, -1));
          break;
        case "listMonth":
          setCurrentDate(subMonths(currentDate, 1));
          break;
      }
    } else {
      switch (view) {
        case "dayGridMonth":
          setCurrentDate(addMonths(currentDate, 1));
          break;
        case "timeGridWeek":
          setCurrentDate(addWeeks(currentDate, 1));
          break;
        case "timeGridDay":
          setCurrentDate(addDays(currentDate, 1));
          break;
        case "listMonth":
          setCurrentDate(addMonths(currentDate, 1));
          break;
      }
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Calendar</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">View meetings, sprints, deadlines, and milestones</p>
          </div>
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load calendar events" onRetry={() => refetch()} />;
  }

  const activeProject = projects.find((p: any) => p.id === activeProjectId);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {allProjectsSelected 
              ? "All Projects View" 
              : activeProject 
                ? `Project: ${activeProject.name}` 
                : "Select a project to view calendar"
            }
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* View Selector */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            {[
              { value: "dayGridMonth", label: "Month", icon: <CalendarIcon className="h-4 w-4" /> },
              { value: "timeGridWeek", label: "Week", icon: <CalendarIcon className="h-4 w-4" /> },
              { value: "timeGridDay", label: "Day", icon: <CalendarIcon className="h-4 w-4" /> },
              { value: "listMonth", label: "List", icon: <CalendarIcon className="h-4 w-4" /> },
            ].map((v) => (
              <button
                key={v.value}
                onClick={() => setView(v.value as any)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === v.value
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("prev")}
              className="p-2 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Today
            </button>
            <button
              onClick={() => navigate("next")}
              className="p-2 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="text-sm font-medium dark:text-white mx-2 hidden sm:block">{getViewTitle()}</span>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 shadow dark:border-gray-700">
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Project Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium dark:text-white">Project:</label>
              <select
                className="rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={selectedProjectFilter || ""}
                onChange={(e) => setSelectedProjectFilter(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All Projects</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium dark:text-white">Event Types:</label>
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
                  onClick={() => setEventTypes(prev => prev.length === eventTypes.length ? [] : eventTypes)}
                >
                  <Filter className="h-4 w-4" />
                  <span>{eventTypes.length === 0 ? "All Types" : `${eventTypes.length} selected`}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {eventTypes.length > 0 && (
                  <div className="absolute right-0 mt-1 w-48 rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-lg z-10">
                    {eventTypes.map((type) => (
                      <label key={type} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={(e) => setEventTypes(prev => e.target.checked ? [...prev, type] : prev.filter(t => t !== type))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm dark:text-white capitalize">{type.toLowerCase().replace(/_/g, " ")}</span>
                        <span className="w-3 h-3 rounded ml-auto" style={{ backgroundColor: getEventColor(type) }} />
                      </label>
                    ))}
                    <button
                      onClick={() => setEventTypes([])}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  className="w-full rounded border border-gray-300 pl-10 pr-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Event Type Legend */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            {eventTypes.map((type) => (
              <span key={type} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: getEventColor(type) }} />
                {type.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="shadow dark:border-gray-700">
        <div className="h-[calc(100vh-300px)] min-h-[600px]">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={view}
            initialDate={currentDate}
            headerToolbar={false}
            events={filteredEvents.map((event: any) => ({
              id: event.id,
              title: event.title,
              start: event.startDate,
              end: event.endDate,
              allDay: event.allDay || false,
              backgroundColor: getEventColor(event.type),
              borderColor: getEventColor(event.type),
              textColor: "#ffffff",
              classNames: [getEventClassNames(event.type)],
              extendedProps: {
                type: event.type,
                description: event.description,
                projectId: event.projectId,
                taskId: event.taskId,
                sprintId: event.sprintId,
                milestoneId: event.milestoneId,
              },
            }))}
            eventClick={handleEventClick}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              meridiem: "short",
            }}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={true}
            height="100%"
            expandRows={true}
            eventDisplay="block"
            eventContent={(eventInfo) => (
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate">{eventInfo.timeText} {eventInfo.event.title}</span>
                {eventInfo.event.extendedProps.description && (
                  <span className="text-xs opacity-80 truncate">{eventInfo.event.extendedProps.description}</span>
                )}
              </div>
            )}
            dayMaxEvents={3}
            moreLinkContent={({ num }) => <span className="text-xs text-blue-600">+{num} more</span>}
            eventDidMount={(info) => {
              info.el.style.cursor = "pointer";
            }}
          />
        </div>
      </Card>

      {/* Event List Sidebar (for list view) */}
      {view === "listMonth" && filteredEvents.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="shadow dark:border-gray-700">
              <h3 className="font-semibold dark:text-white mb-4 p-4 border-b border-gray-200 dark:border-gray-700">Event Details</h3>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {filteredEvents.slice(0, 20).map((event: any) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => handleEventClick({ event: { 
                      id: event.id, 
                      title: event.title, 
                      start: event.startDate, 
                      end: event.endDate,
                      allDay: event.allDay,
                      extendedProps: event
                    } })}
                  >
                    <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: getEventColor(event.type) }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium dark:text-white">{event.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{formatEventTime(event)}</span>
                        <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 capitalize">{event.type?.toLowerCase().replace(/_/g, " ")}</span>
                      </p>
                      {event.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

function CardSkeleton() {
  return (
    <Card className="shadow dark:border-gray-700 animate-pulse h-[600px]">
      <div className="h-full bg-gray-200 dark:bg-gray-700 rounded" />
    </Card>
  );
}

export default CalendarPage;