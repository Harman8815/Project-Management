"use client";

import { useAppSelector } from "@/app/redux";
import Header from "@/components/Header";
import { ErrorState, CardSkeleton } from "@/components/ui";
import { useGetTimelineQuery } from "@/state/api";
import { DisplayOption, Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Calendar, Clock, Filter, List, LayoutGrid, X, Eye, EyeOff, ChevronLeft } from "lucide-react";

type TaskTypeItems = "task" | "milestone" | "project";
type LayoutMode = "horizontal" | "vertical";

const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"] as const;
const PROJECT_PRIORITIES = ["Urgent", "High", "Medium", "Low", "Backlog"] as const;
const PROJECT_HEALTHS = ["ON_TRACK", "AT_RISK", "OFF_TRACK", "BLOCKED"] as const;
const SPRINT_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

interface TimelineFilters {
  projectStatus: string[];
  projectPriority: string[];
  projectHealth: string[];
  sprintStatus: string[];
  delayedOnly: boolean;
  completedOnly: boolean;
  activeOnly: boolean;
}

const defaultFilters: TimelineFilters = {
  projectStatus: [],
  projectPriority: [],
  projectHealth: [],
  sprintStatus: [],
  delayedOnly: false,
  completedOnly: false,
  activeOnly: false,
};

const Timeline = () => {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const activeProjectId = useAppSelector((state) => state.global.activeProjectId);
  const allProjectsSelected = useAppSelector((state) => state.global.allProjectsSelected);
  const selectedProjectId = allProjectsSelected ? null : activeProjectId;
  const timelineQuerySkipped = !allProjectsSelected && !activeProjectId;
  const { data: timelineProjects, isLoading, isError } = useGetTimelineQuery(
    { projectId: selectedProjectId },
    { skip: timelineQuerySkipped },
  );
  const [displayOptions, setDisplayOptions] = useState<DisplayOption>({
    viewMode: ViewMode.Month,
    locale: "en-US",
  });
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("horizontal");
  const [filters, setFilters] = useState<TimelineFilters>(defaultFilters);
  const [hiddenProjects, setHiddenProjects] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    projectName: true,
    startDate: true,
    endDate: true,
    progress: true,
    owner: true,
    health: true,
    delay: true,
  });

  const toggleExpand = (projectId: number) => {
    setExpandedProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const toggleHidden = (projectId: number) => {
    setHiddenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const toggleFilter = (key: keyof Omit<TimelineFilters, "delayedOnly" | "completedOnly" | "activeOnly">, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const clearFilters = () => setFilters(defaultFilters);

  const visibleProjects = useMemo(() => {
    if (!timelineProjects) return [];
    return timelineProjects.filter((project) => {
      if (hiddenProjects.has(project.id)) return false;
      if (filters.delayedOnly && !project.delayed) return false;
      if (filters.completedOnly && project.status !== "COMPLETED" && project.status !== "ARCHIVED") return false;
      if (filters.activeOnly && (project.status === "COMPLETED" || project.status === "ARCHIVED")) return false;
      if (filters.projectStatus.length > 0 && !filters.projectStatus.includes(project.status ?? "")) return false;
      if (filters.projectPriority.length > 0 && project.priority && !filters.projectPriority.includes(project.priority)) return false;
      if (filters.projectHealth.length > 0 && project.health && !filters.projectHealth.includes(project.health)) return false;
      return true;
    });
  }, [timelineProjects, filters, hiddenProjects]);

  const { ganttTasks, delayInfo } = useMemo(() => {
    const tasks: any[] = [];
    const delays: Record<number, { delayed: boolean; delayDays: number }> = {};

    visibleProjects.forEach((project) => {
      const start = new Date(project.startDate as string);
      const end = new Date(project.endDate as string);
      const now = new Date();
      const isCompleted = project.status === "COMPLETED" || project.status === "ARCHIVED";
      const totalMs = end.getTime() - start.getTime();
      const elapsedMs = now.getTime() - start.getTime();
      const progress = totalMs > 0 ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100))) : 0;

      tasks.push({
        start,
        end,
        name: project.name,
        id: `Project-${project.id}`,
        type: "project" as TaskTypeItems,
        progress: isCompleted ? 100 : progress,
        isDisabled: false,
        ...(project.endDate && !isCompleted && now > end && project.status !== "ARCHIVED"
          ? { backgroundColor: "#ef4444", progressColor: "#ef4444" }
          : {}),
      });

      delays[project.id] = {
        delayed: project.delayed ?? false,
        delayDays: project.delayDays ?? 0,
      };

      if (expandedProjects[project.id] && project.sprints) {
        project.sprints.forEach((sprint) => {
          const sprintStart = sprint.startDate ? new Date(sprint.startDate) : start;
          const sprintEnd = sprint.endDate ? new Date(sprint.endDate) : end;

          tasks.push({
            start: sprintStart,
            end: sprintEnd,
            name: `↳ ${sprint.name}`,
            id: `Sprint-${sprint.id}`,
            type: "task" as TaskTypeItems,
            progress: 0,
            isDisabled: false,
            project: project.id,
          });
        });
      }
    });

    return { ganttTasks: tasks, delayInfo: delays };
  }, [visibleProjects, expandedProjects]);

  const handleViewModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDisplayOptions((prev) => ({ ...prev, viewMode: event.target.value as ViewMode }));
  };

  const toggleColumn = (key: keyof typeof columnVisibility) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetColumns = () => {
    setColumnVisibility({
      projectName: true,
      startDate: true,
      endDate: true,
      progress: true,
      owner: true,
      health: true,
      delay: true,
    });
  };

  const renderProjectRow = (project: any) => {
    const info = delayInfo[project.id];
    const now = new Date();
    const isCompleted = project.status === "COMPLETED" || project.status === "ARCHIVED";
    const start = new Date(project.startDate as string);
    const end = new Date(project.endDate as string);
    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = now.getTime() - start.getTime();
    const progress = totalMs > 0 ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100))) : 0;

    return (
      <div key={project.id} className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {columnVisibility.projectName && (
              <>
                <button
                  onClick={() => toggleExpand(project.id)}
                  className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {expandedProjects[project.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <span className="w-48 font-semibold dark:text-white">{project.name}</span>
              </>
            )}
            {!columnVisibility.projectName && (
              <button
                onClick={() => toggleExpand(project.id)}
                className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {expandedProjects[project.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            {info?.delayed && columnVisibility.delay && (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <Clock size={12} />
                Delayed by {info.delayDays} day(s)
              </span>
            )}
            {project.sprints && project.sprints.length > 0 && (
              <span className="text-xs text-gray-500">
                {project.sprints.length} sprint(s)
              </span>
            )}
            <button
              onClick={() => toggleHidden(project.id)}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              title={hiddenProjects.has(project.id) ? "Show project" : "Hide project"}
            >
              {hiddenProjects.has(project.id) ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
          {columnVisibility.startDate && (
            <span className="text-xs text-gray-500">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
            </span>
          )}
          {columnVisibility.endDate && (
            <span className="text-xs text-gray-500">
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : "—"}
            </span>
          )}
          {columnVisibility.progress && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 rounded bg-gray-200 dark:bg-gray-700">
                <div className="h-full rounded bg-blue-600" style={{ width: `${isCompleted ? 100 : progress}%` }} />
              </div>
              <span className="text-xs text-gray-500">{isCompleted ? 100 : progress}%</span>
            </div>
          )}
          {columnVisibility.health && (
            <span className="text-xs text-gray-500">{project.health ?? "ON_TRACK"}</span>
          )}
        </div>
        {expandedProjects[project.id] && project.sprints && (
          <div className="ml-6 mt-2 space-y-1">
            {project.sprints.map((sprint: any) => (
              <div
                key={sprint.id}
                className={`flex items-center justify-between rounded bg-gray-50 p-2 text-sm dark:bg-gray-800 ${
                  sprint.startDate && new Date(sprint.startDate) > now ? "text-gray-400" : ""
                }`}
              >
                <span>↳ {sprint.name}</span>
                <span className="text-xs text-gray-400">
                  {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : "—"} –{" "}
                  {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading || (timelineQuerySkipped && !timelineProjects)) {
    return (
      <div className="max-w-full p-8">
        <header className="mb-4 flex items-center justify-between">
          <Header name="Projects Timeline" />
          <div className="relative inline-block w-64">
            <select className="rounded border p-2 dark:bg-gray-800" value={displayOptions.viewMode} onChange={handleViewModeChange}>
              <option value={ViewMode.Day}>Day</option>
              <option value={ViewMode.Week}>Week</option>
              <option value={ViewMode.Month}>Month</option>
            </select>
          </div>
        </header>
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (isError || !timelineProjects) {
    return <ErrorState message="Failed to load timeline" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-full p-8">
      <header className="mb-4 flex items-center justify-between">
        <Header name="Projects Timeline" />
        <div className="flex items-center gap-4">
          <div className="relative inline-block w-64">
            <select className="rounded border p-2 dark:bg-gray-800" value={displayOptions.viewMode} onChange={handleViewModeChange}>
              <option value={ViewMode.Day}>Day</option>
              <option value={ViewMode.Week}>Week</option>
              <option value={ViewMode.Month}>Month</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLayoutMode("horizontal")}
              className={`rounded p-2 ${layoutMode === "horizontal" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}
              title="Horizontal timeline"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setLayoutMode("vertical")}
              className={`rounded p-2 ${layoutMode === "vertical" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}
              title="Vertical timeline"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded p-2 ${showFilters ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}
              title="Filters"
            >
              <Filter size={16} />
            </button>
            <button
              onClick={() => setShowColumns(!showColumns)}
              className={`rounded p-2 ${showColumns ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}
              title="Columns"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => {
                setShowFilters(false);
                setShowColumns(false);
                setHiddenProjects(new Set());
                setExpandedProjects({});
              }}
              className="rounded p-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
              title="Reset view"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </header>

      {showFilters && (
        <div className="mb-4 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold dark:text-white">Filters</h3>
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Clear all</button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium dark:text-white">Project status</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {PROJECT_STATUSES.map((s) => (
                  <label key={s} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={filters.projectStatus.includes(s)}
                      onChange={() => toggleFilter("projectStatus", s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-white">Project priority</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {PROJECT_PRIORITIES.map((p) => (
                  <label key={p} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={filters.projectPriority.includes(p)}
                      onChange={() => toggleFilter("projectPriority", p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-white">Project health</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {PROJECT_HEALTHS.map((h) => (
                  <label key={h} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={filters.projectHealth.includes(h)}
                      onChange={() => toggleFilter("projectHealth", h)}
                    />
                    {h}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-white">Sprint status</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {SPRINT_STATUSES.map((s) => (
                  <label key={s} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={filters.sprintStatus.includes(s)}
                      onChange={() => toggleFilter("sprintStatus", s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={filters.delayedOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, delayedOnly: e.target.checked }))}
                />
                Delayed only
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={filters.completedOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, completedOnly: e.target.checked }))}
                />
                Completed only
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={filters.activeOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, activeOnly: e.target.checked }))}
                />
                Active only
              </label>
            </div>
          </div>
        </div>
      )}

      {showColumns && (
        <div className="mb-4 rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold dark:text-white">Column visibility (vertical layout)</h3>
            <button onClick={resetColumns} className="text-sm text-blue-600 hover:underline">Reset</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(columnVisibility).map(([key, visible]) => (
              <label key={key} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => toggleColumn(key as keyof typeof columnVisibility)}
                />
                {key.replace(/([A-Z])/g, " $1").trim()}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 space-y-2">
        {visibleProjects.map((project) => {
          const info = delayInfo[project.id];
          return (
            <div key={project.id} className="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpand(project.id)}
                    className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {expandedProjects[project.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <span className="font-semibold dark:text-white">{project.name}</span>
                  {info?.delayed && (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <Clock size={12} />
                      Delayed by {info.delayDays} day(s)
                    </span>
                  )}
                  {project.sprints && project.sprints.length > 0 && (
                    <span className="text-xs text-gray-500">{project.sprints.length} sprint(s)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={14} />
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"} –{" "}
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {layoutMode === "horizontal" ? (
        <div className="overflow-hidden rounded-md bg-white shadow dark:bg-dark-secondary dark:text-white">
          <div className="timeline">
            <Gantt
              tasks={ganttTasks}
              {...displayOptions}
              columnWidth={displayOptions.viewMode === ViewMode.Month ? 150 : 100}
              listCellWidth="100px"
              projectBackgroundColor={isDarkMode ? "#101214" : "#1f2937"}
              projectProgressColor={isDarkMode ? "#1f2937" : "#aeb8c2"}
              projectProgressSelectedColor={isDarkMode ? "#000" : "#9ba1a6"}
            />
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-900">
          <div className="max-h-[600px] overflow-y-auto">
            {visibleProjects.map(renderProjectRow)}
          </div>
        </div>
      )}

      {hiddenProjects.size > 0 && (
        <div className="mt-4 rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {hiddenProjects.size} project(s) hidden. <button onClick={() => setHiddenProjects(new Set())} className="text-blue-600 hover:underline">Show all</button>
          </p>
        </div>
      )}
    </div>
  );
};

export default Timeline;
