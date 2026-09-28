"use client";

import { Project, useGetProjectsQuery } from "@/state/api";
import { setActiveProjectId, setAllProjectsSelected } from "@/state";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { ChevronDown, CheckCircle, AlertCircle, Clock, Search, BarChart3 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { CardSkeleton } from "@/components/ui";

const statusIcons: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle className="h-3 w-3 text-green-500" />,
  ON_HOLD: <AlertCircle className="h-3 w-3 text-amber-500" />,
  COMPLETED: <CheckCircle className="h-3 w-3 text-blue-500" />,
  ARCHIVED: <Clock className="h-3 w-3 text-gray-400" />,
};

const healthColors: Record<string, string> = {
  ON_TRACK: "bg-green-500",
  AT_RISK: "bg-amber-500",
  OFF_TRACK: "bg-red-500",
  BLOCKED: "bg-gray-500",
};

const ACTIVE_PROJECTS_KEY = "projex-active-project";

const ProjectSwitcher = () => {
  const dispatch = useAppDispatch();
  const { data: allProjects = [], isLoading } = useGetProjectsQuery();
  const activeProjectId = useAppSelector((state) => state.global.activeProjectId);
  const allProjectsSelected = useAppSelector((state) => state.global.allProjectsSelected);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!activeProjectId && !allProjectsSelected && allProjects.length > 0) {
      const active = allProjects.find((p) => !p.archived);
      if (active) {
        dispatch(setActiveProjectId(active.id));
      }
    }
  }, [activeProjectId, allProjectsSelected, allProjects, dispatch]);

  useEffect(() => {
    if (allProjects.length === 0) return;
    if (allProjectsSelected) {
      localStorage.setItem(ACTIVE_PROJECTS_KEY, "all");
    } else if (activeProjectId) {
      const exists = allProjects.some((p) => p.id === activeProjectId);
      if (exists) {
        localStorage.setItem(ACTIVE_PROJECTS_KEY, String(activeProjectId));
      } else if (!exists && allProjects.find((p) => !p.archived)) {
        const fallback = allProjects.find((p) => !p.archived);
        if (fallback) dispatch(setActiveProjectId(fallback.id));
      }
    }
  }, [activeProjectId, allProjectsSelected, allProjects, dispatch]);

  useEffect(() => {
    if (allProjects.length === 0) return;
    const stored = localStorage.getItem(ACTIVE_PROJECTS_KEY);
    if (!stored) return;

    if (stored === "all") {
      if (!allProjectsSelected) {
        dispatch(setAllProjectsSelected(true));
      }
      return;
    }

    const storedId = Number(stored);
    const exists = allProjects.some((p) => p.id === storedId);
    if (exists) {
      if (activeProjectId !== storedId) {
        dispatch(setActiveProjectId(storedId));
      }
    } else {
      const fallback = allProjects.find((p) => !p.archived);
      if (fallback && activeProjectId !== fallback.id) {
        dispatch(setActiveProjectId(fallback.id));
      }
    }
  }, [allProjects, activeProjectId, allProjectsSelected, dispatch]);

  const activeProject = allProjects.find((p) => p.id === activeProjectId);

  const projectsForDisplay = useMemo(() => {
    return [{ id: 0, key: "", name: "All Projects", status: "ACTIVE" } as Project, ...allProjects];
  }, [allProjects]);

  const filteredProjects = searchTerm
    ? projectsForDisplay.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.key?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false),
      )
    : projectsForDisplay;

  const displayLabel = allProjectsSelected
    ? "All Projects"
    : activeProject
      ? `${activeProject.key ?? ""} ${activeProject.name}`.trim()
      : "Select project";

  const handleSelect = (project: Project) => {
    if (project.id === 0) {
      dispatch(setAllProjectsSelected(true));
      dispatch(setActiveProjectId(null));
    } else {
      dispatch(setAllProjectsSelected(false));
      dispatch(setActiveProjectId(project.id));
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-64">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-left shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
          onBlur={() => setIsOpen(false)}
        >
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full rounded border border-gray-300 px-8 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {isLoading ? (
            <div className="p-2">
              <CardSkeleton count={3} />
            </div>
          ) : (
            <ul className="py-1 text-sm">
              {filteredProjects.map((project) => (
                <li key={project.id}>
                  <button
                    onClick={() => handleSelect(project)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      (allProjectsSelected && project.id === 0) ||
                      (!allProjectsSelected && project.id === activeProjectId)
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {project.id === 0 ? (
                        <BarChart3 className="h-4 w-4 text-gray-500" />
                      ) : (
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {project.key ?? `#${project.id}`}
                        </span>
                      )}
                      <span
                        className={`${project.archived ? "line-through opacity-60" : ""}`}
                      >
                        {project.name}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      {project.id !== 0 && statusIcons[project.status ?? "ACTIVE"]}
                      {project.health && project.id !== 0 && (
                        <span
                          className={`h-2 w-2 rounded-full ${healthColors[project.health] ?? "bg-gray-400"}`}
                          title={project.health}
                        />
                      )}
                      {project.archived && <span className="text-xs text-gray-400">Archived</span>}
                    </span>
                  </button>
                </li>
              ))}
              {filteredProjects.length === 0 && (
                <li className="px-3 py-2 text-gray-500 dark:text-gray-400">No projects found</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSwitcher;
