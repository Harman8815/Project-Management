"use client";

import { Card } from "@/components/ui";
import { useDuplicateProjectMutation, useGetProjectsQuery } from "@/state/api";
import { X, Copy, Check, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "@/components/ui/toast";

interface ProjectDuplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  projectKey: string;
}

const ProjectDuplicationModal = ({ isOpen, onClose, projectId, projectName, projectKey }: ProjectDuplicationModalProps) => {
  const [duplicateProject, { isLoading }] = useDuplicateProjectMutation();
  const { data: projects = [] } = useGetProjectsQuery();
  
  const [step, setStep] = useState<"configure" | "confirm" | "complete">("configure");
  const [name, setName] = useState(`${projectName} - Copy`);
  const [key, setKey] = useState(`${projectKey}-COPY`);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeTaskStructure, setIncludeTaskStructure] = useState(true);
  const [includeSprints, setIncludeSprints] = useState(true);
  const [includeMilestones, setIncludeMilestones] = useState(true);
  const [includeWorkflows, setIncludeWorkflows] = useState(false);
  const [includeCustomFields, setIncludeCustomFields] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<{
    taskCount?: number;
    sprintCount?: number;
    milestoneCount?: number;
  } | null>(null);

  const validateInputs = () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Project name is required");
    if (!key.trim()) errors.push("Project key is required");
    if (!/^[A-Z0-9-]+$/.test(key)) errors.push("Project key must contain only uppercase letters, numbers, and hyphens");
    if (key.length > 10) errors.push("Project key must be 10 characters or less");
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleDuplicate = async () => {
    if (!validateInputs()) return;

    try {
      const result = await duplicateProject({
        id: projectId,
        name: name.trim(),
        key: key.trim().toUpperCase(),
        include: {
          includeTasks,
          includeTaskStructure,
          includeSprints,
          includeMilestones,
          includeWorkflows,
          includeCustomFields,
        },
      }).unwrap();
      
      toast.success("Project duplicated successfully");
      setStep("complete");
      setTimeout(() => {
        onClose();
        window.location.href = `/projects/${result.id}`;
      }, 1500);
    } catch (error: any) {
      toast.error(error?.data?.message || "Duplication failed");
    }
  };

  const generatePreview = () => {
    // In a real implementation, this would call an API to get counts
    // For now, we'll show placeholder
    setPreviewData({
      taskCount: 0,
      sprintCount: 0,
      milestoneCount: 0,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {step === "configure" && <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">1. Configure</span>}
            {step === "confirm" && <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">2. Confirm</span>}
            {step === "complete" && <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">3. Complete</span>}
            <h2 className="text-lg font-semibold dark:text-white ml-2">Duplicate Project</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Configure */}
        {step === "configure" && (
          <div className="p-4 space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Source Project</p>
              <p className="font-medium dark:text-white">{projectName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{projectKey}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">New Project Name</label>
                <input
                  type="text"
                  className={`w-full rounded border p-2 ${validationErrors.includes("Project name is required") ? "border-red-500" : "border-gray-300 dark:border-gray-600"} dark:bg-gray-700 dark:text-white`}
                  placeholder="Enter new project name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {validationErrors.includes("Project name is required") && (
                  <p className="text-sm text-red-500 mt-1">Project name is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">New Project Key</label>
                <input
                  type="text"
                  className={`w-full rounded border p-2 ${validationErrors.some(e => e.includes("key")) ? "border-red-500" : "border-gray-300 dark:border-gray-600"} dark:bg-gray-700 dark:text-white`}
                  placeholder="PROJ-COPY"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  maxLength={10}
                />
                {validationErrors.some(e => e.includes("key")) && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.find(e => e.includes("key"))}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Uppercase letters, numbers, and hyphens only (max 10 chars)</p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium dark:text-white mb-3">Content to Duplicate</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTasks}
                    onChange={(e) => setIncludeTasks(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm dark:text-white">Tasks</span>
                </label>
                {includeTasks && (
                  <label className="flex items-center gap-2 cursor-pointer ml-6">
                    <input
                      type="checkbox"
                      checked={includeTaskStructure}
                      onChange={(e) => setIncludeTaskStructure(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm dark:text-white">Task structure (parent/child, dependencies)</span>
                  </label>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSprints}
                    onChange={(e) => setIncludeSprints(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm dark:text-white">Sprints</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMilestones}
                    onChange={(e) => setIncludeMilestones(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm dark:text-white">Milestones</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWorkflows}
                    onChange={(e) => setIncludeWorkflows(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm dark:text-white">Workflows</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCustomFields}
                    onChange={(e) => setIncludeCustomFields(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm dark:text-white">Custom field values</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (validateInputs()) {
                    generatePreview();
                    setStep("confirm");
                  }
                }}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Next: Review
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === "confirm" && (
          <div className="p-4 space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium dark:text-white">Please review before duplicating</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone. A new project will be created with the selected content.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="shadow dark:border-gray-700">
                <h4 className="font-medium dark:text-white mb-3 flex items-center gap-2">
                  <Copy className="h-5 w-5 text-gray-500" /> Source
                </h4>
                <p className="font-medium dark:text-white">{projectName}</p>
                <p className="text-sm text-gray-500 font-mono">{projectKey}</p>
              </Card>
              <Card className="shadow dark:border-gray-700">
                <h4 className="font-medium dark:text-white mb-3 flex items-center gap-2">
                  <Copy className="h-5 w-5 text-gray-500" /> New Project
                </h4>
                <p className="font-medium dark:text-white">{name}</p>
                <p className="text-sm text-gray-500 font-mono">{key.toUpperCase()}</p>
              </Card>
            </div>

            <Card className="shadow dark:border-gray-700">
              <h4 className="font-medium dark:text-white mb-3">Content to be duplicated</h4>
              <div className="space-y-2">
                {includeTasks && <RowItem label="Tasks" value={previewData?.taskCount ? `${previewData.taskCount} tasks` : "Included"} />}
                {includeTaskStructure && <RowItem label="Task Structure" value="Included" />}
                {includeSprints && <RowItem label="Sprints" value={previewData?.sprintCount ? `${previewData.sprintCount} sprints` : "Included"} />}
                {includeMilestones && <RowItem label="Milestones" value={previewData?.milestoneCount ? `${previewData.milestoneCount} milestones` : "Included"} />}
                {includeWorkflows && <RowItem label="Workflows" value="Included" />}
                {includeCustomFields && <RowItem label="Custom Fields" value="Included" />}
              </div>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setStep("configure")}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleDuplicate}
                disabled={isLoading}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Duplicating...
                  </>
                ) : (
                  "Create Project"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === "complete" && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold dark:text-white mb-2">Project Duplicated Successfully</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              "{name}" has been created. Redirecting to the new project...
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                className="rounded bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RowItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700/50">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium dark:text-white">{value}</span>
    </div>
  );
}

export default ProjectDuplicationModal;