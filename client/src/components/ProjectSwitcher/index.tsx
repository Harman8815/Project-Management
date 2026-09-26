"use client";

import { Project, useGetProjectsQuery } from "@/state/api";
import { setActiveProjectId } from "@/state";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { ChevronDown, CheckCircle, AlertCircle, Clock } from "lucide-react";
import React, { useEffect, useState } from "react";

const statusIcons: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle className="h-3 w-3 text-green-500" />,
  ON_HOLD: <AlertCircle className="h-3 w-3 text-amber-500" />,
  COMPLETED: <CheckCircle className="h-3 w-3 text-blue-500" />,
  ARCHIVED: <Clock className="h-3 w-3 text-gray-400" />,
};

const ProjectSwitcher = () => {
  const dispatch = useAppDispatch();
  const { data: projects = [], isLoading } = useGetProjectsQuery();
  const activeProjectId = useAppSelector((state) => state.global.activeProjectId);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      dispatch(setActiveProjectId(projects[0].id));
    }
  }, [activeProjectId, projects, dispatch]);

  const filteredProjects = searchTerm
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.key?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false),
      )
    : projects;

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="relative inline-block w-64">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-left shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {activeProject ? `${activeProject.key ?? ""} ${activeProject.name}`.trim() : "Select project"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
          onBlur={() => setIsOpen(false)}
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isLoading ? (
            <div className="p-2 text-sm text-gray-500 dark:text-gray-400">Loading projects...</div>
          ) : (
            <ul className="py-1 text-sm">
              {filteredProjects.map((project) => (
                <li key={project.id}>
                  <button
                    onClick={() => {
                      dispatch(setActiveProjectId(project.id));
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      project.id === activeProjectId ? "bg-gray-100 dark:bg-gray-700" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {project.key ?? `#${project.id}`}
                      </span>
                      <span
                        className={`${
                          project.archived ? "line-through opacity-60" : ""
                        }`}
                      >
                        {project.name}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      {statusIcons[project.status ?? "ACTIVE"]}
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
