"use client";

import { Card, ErrorState, LoadingState } from "@/components/ui";
import { useGetProjectsQuery, useGetEmployeesQuery } from "@/state/api";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { useState } from "react";
import { X, ChevronDown, Search, User, Briefcase, AlertCircle, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { useTransferResourceMutation, useGetResourceTransferHistoryQuery } from "@/state/api";
import { toast } from "@/components/ui/toast";

interface ResourceTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmployeeId?: number;
}

const ResourceTransferModal = ({ isOpen, onClose, defaultEmployeeId }: ResourceTransferModalProps) => {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<"select-employee" | "select-project" | "confirm" | "complete">("select-employee");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(defaultEmployeeId || null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [role, setRole] = useState<"OWNER" | "ADMIN" | "MEMBER">("MEMBER");
  const [searchEmployee, setSearchEmployee] = useState("");
  const [searchProject, setSearchProject] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyEmployeeId, setHistoryEmployeeId] = useState<number | null>(null);

  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: employees = [], isLoading: employeesLoading } = useGetEmployeesQuery();
  const [transferResource, { isLoading: transferring }] = useTransferResourceMutation();

  // Reset state when modal opens/closes
  if (!isOpen) {
    setStep("select-employee");
    setSelectedEmployeeId(defaultEmployeeId || null);
    setSelectedProjectId(null);
    setRole("MEMBER");
    setSearchEmployee("");
    setSearchProject("");
  }

  const filteredEmployees = employees.filter((e) =>
    e.username.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchProject.toLowerCase()) ||
    p.key?.toLowerCase().includes(searchProject.toLowerCase())
  );

  const selectedEmployee = employees.find((e) => e.userId === selectedEmployeeId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleTransfer = async () => {
    if (!selectedEmployeeId || !selectedProjectId) return;
    
    try {
      await transferResource({
        userId: selectedEmployeeId,
        targetProjectId: selectedProjectId,
        role,
      }).unwrap();
      
      toast.success("Employee transferred successfully");
      setStep("complete");
      setTimeout(() => onClose(), 1500);
    } catch (error: any) {
      toast.error(error?.data?.message || "Transfer failed");
    }
  };

  const handleShowHistory = (employeeId: number) => {
    setHistoryEmployeeId(employeeId);
    setShowHistory(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">Transfer Employee</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-gray-200 p-4 dark:border-gray-700">
          {["select-employee", "select-project", "confirm", "complete"].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${step === s ? "text-blue-600" : "text-gray-400"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === s ? "bg-blue-600 text-white" : 
                  ["select-employee", "select-project", "confirm", "complete"].indexOf(step) > i ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                }`}>
                  {["select-employee", "select-project", "confirm", "complete"].indexOf(step) > i ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {s === "select-employee" && "Employee"}
                  {s === "select-project" && "Project"}
                  {s === "confirm" && "Confirm"}
                  {s === "complete" && "Done"}
                </span>
              </div>
              {i < 3 && (
                <div className={`flex-1 h-0.5 mx-2 ${["select-employee", "select-project", "confirm"].indexOf(step) > i ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Step 1: Select Employee */}
          {step === "select-employee" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">
                  Select Employee to Transfer
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    className="w-full rounded border border-gray-300 pl-10 pr-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={searchEmployee}
                    onChange={(e) => setSearchEmployee(e.target.value)}
                  />
                </div>
              </div>
              
              {employeesLoading ? (
                <LoadingState />
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded dark:border-gray-700">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No employees found
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp.userId}
                        onClick={() => {
                          setSelectedEmployeeId(emp.userId);
                          setStep("select-project");
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          selectedEmployeeId === emp.userId ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500" : ""
                        }`}
                      >
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium dark:text-white truncate">{emp.username}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{emp.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {emp.availability === "BENCH" && (
                              <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Bench</span>
                            )}
                            {emp.currentProjectId && (
                              <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                Project: {emp.currentProjectId}
                              </span>
                            )}
                            {emp.experienceLevel && (
                              <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {emp.experienceLevel}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedEmployeeId === emp.userId && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Project */}
          {step === "select-project" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <ArrowRight className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium dark:text-white">Transferring:</p>
                    <p className="text-sm">{selectedEmployee?.username}</p>
                    <p className="text-xs text-gray-500">{selectedEmployee?.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">
                  Select Target Project
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full rounded border border-gray-300 pl-10 pr-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={searchProject}
                    onChange={(e) => setSearchProject(e.target.value)}
                  />
                </div>
              </div>

              {projectsLoading ? (
                <LoadingState />
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded dark:border-gray-700">
                  {filteredProjects.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No projects found
                    </div>
                  ) : (
                    filteredProjects
                      .filter((p) => p.id !== selectedEmployee?.currentProjectId)
                      .map((project) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setStep("confirm");
                          }}
                          className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                            selectedProjectId === project.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500" : ""
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium dark:text-white truncate">{project.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{project.key ?? project.id}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {project.status}
                              </span>
                            </div>
                          </div>
                          {selectedProjectId === project.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </button>
                      ))
                  )}
                </div>
              )}

              <div className="pt-2">
                <label className="block text-sm font-medium dark:text-white mb-2">Role in New Project</label>
                <select
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "OWNER" | "ADMIN" | "MEMBER")}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                  <div>
                    <p className="font-medium dark:text-white">Please confirm the transfer</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This will remove the employee from their current project and assign them to the new project.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow dark:border-gray-700">
                  <h4 className="font-medium dark:text-white mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" /> From
                  </h4>
                  <div className="space-y-2">
                    <p className="font-medium dark:text-white">{selectedEmployee?.username}</p>
                    <p className="text-sm text-gray-500">{selectedEmployee?.email}</p>
                    {selectedEmployee?.currentProjectId && (
                      <p className="text-sm text-gray-500">
                        Current Project: {selectedEmployee.currentProjectId}
                      </p>
                    )}
                  </div>
                </Card>
                <Card className="shadow dark:border-gray-700">
                  <h4 className="font-medium dark:text-white mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gray-500" /> To
                  </h4>
                  <div className="space-y-2">
                    <p className="font-medium dark:text-white">{selectedProject?.name}</p>
                    <p className="text-sm text-gray-500 font-mono">{selectedProject?.key ?? selectedProject?.id}</p>
                    <p className="text-sm text-gray-500">Role: {role}</p>
                  </div>
                </Card>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setStep("select-project")}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={transferring}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {transferring ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Transferring...
                    </span>
                  ) : (
                    "Confirm Transfer"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold dark:text-white mb-2">Transfer Complete</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {selectedEmployee?.username} has been successfully transferred to {selectedProject?.name}
              </p>
              <button
                onClick={onClose}
                className="rounded bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          )}

          {/* Transfer History Modal */}
          {showHistory && historyEmployeeId && (
            <TransferHistoryModal
              employeeId={historyEmployeeId}
              onClose={() => setShowHistory(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function TransferHistoryModal({ employeeId, onClose }: { employeeId: number; onClose: () => void }) {
  const { data: history = [], isLoading } = useGetResourceTransferHistoryQuery(employeeId);
  const employee = employeeId > 0 ? undefined : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">Transfer History</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <LoadingState />
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No transfer history found
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((transfer) => (
                <Card key={transfer.id} className="shadow dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/30">
                        <ArrowRight className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">
                          {transfer.projectKey ?? `Project #${transfer.toProjectId}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          Transferred by {transfer.actorName ?? "System"} · {transfer.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm dark:text-white">
                        {new Date(transfer.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transfer.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResourceTransferModal;