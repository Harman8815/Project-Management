"use client";

import { Card, LoadingState, ErrorState, Skeleton } from "@/components/ui";
import { useGetResourceOverviewQuery, useGetEmployeesQuery, useGetResourcesByProjectQuery, useGetResourcesBySkillQuery, useGetBenchCandidatesQuery, useValidateBulkImportMutation, useConfirmBulkImportMutation, useLazyGetBulkTemplateQuery, useLazyExportBulkDataQuery } from "@/state/api";
import { Users, UserCheck, UserPlus, UserMinus, Target, BarChart3, Briefcase, GraduationCap, Zap, AlertCircle, ChevronRight, Upload, Download, FileText, AlertTriangle, CheckCircle, X, Loader2, Plus } from "lucide-react";
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import ResourceTransferModal from "@/components/ResourceTransferModal";

const ResourceManagement = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "by-project" | "by-skill" | "bench" | "import-export">("overview");
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferEmployeeId, setTransferEmployeeId] = useState<number | null>(null);
  
  const { data: overview, isLoading: overviewLoading } = useGetResourceOverviewQuery();
  const { data: employees, isLoading: employeesLoading } = useGetEmployeesQuery();
  const { data: byProject, isLoading: byProjectLoading } = useGetResourcesByProjectQuery();
  const { data: bySkill, isLoading: bySkillLoading } = useGetResourcesBySkillQuery();
  const { data: bench, isLoading: benchLoading } = useGetBenchCandidatesQuery();
  const [validateImport, { isLoading: validating }] = useValidateBulkImportMutation();
  const [confirmImport, { isLoading: importing }] = useConfirmBulkImportMutation();
  const [downloadTemplate, { isLoading: downloadingTemplate }] = useLazyGetBulkTemplateQuery();
  const [exportData, { isLoading: exporting }] = useLazyExportBulkDataQuery();
  
  const [importEntity, setImportEntity] = useState<"employees" | "projects" | "skills" | "projectMemberships" | "employeeSkills">("employees");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [validationReport, setValidationReport] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [exportEntity, setExportEntity] = useState<"employees" | "projects" | "skills" | "projectMemberships" | "employeeSkills">("employees");
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("xlsx");

  const ENTITIES = [
    { value: "employees", label: "Employees", icon: <Users className="h-4 w-4" /> },
    { value: "projects", label: "Projects", icon: <Briefcase className="h-4 w-4" /> },
    { value: "skills", label: "Skills", icon: <GraduationCap className="h-4 w-4" /> },
    { value: "projectMemberships", label: "Project Members", icon: <UserCheck className="h-4 w-4" /> },
    { value: "employeeSkills", label: "Employee Skills", icon: <GraduationCap className="h-4 w-4" /> },
  ] as const;

  if (activeTab === "overview" && overviewLoading) {
    return <DashboardSkeleton />;
  }
  if (activeTab === "by-project" && byProjectLoading) {
    return <DashboardSkeleton />;
  }
  if (activeTab === "by-skill" && bySkillLoading) {
    return <DashboardSkeleton />;
  }
  if (activeTab === "bench" && benchLoading) {
    return <DashboardSkeleton />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setValidationReport(null);
      setShowConfirm(false);
    }
  };

  const handleValidate = async () => {
    if (!importFile) return;
    try {
      const report = await validateImport({ entity: importEntity, file: importFile }).unwrap();
      setValidationReport(report);
      if (report.valid) {
        setShowConfirm(true);
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationReport) return;
    try {
      await confirmImport({ entity: importEntity, data: validationReport.preview.map((p: any) => p.data) }).unwrap();
      setImportFile(null);
      setValidationReport(null);
      setShowConfirm(false);
      alert("Import completed successfully!");
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Please check the data.");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadTemplate({ entity: importEntity }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${importEntity}-template.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportData({ entity: exportEntity, format: exportFormat }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportEntity}-export.${exportFormat === "csv" ? "csv" : "xlsx"}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const openTransferModal = (employeeId: number) => {
    setTransferEmployeeId(employeeId);
    setTransferModalOpen(true);
  };

  const handleTransferComplete = () => {
    setTransferModalOpen(false);
    setTransferEmployeeId(null);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Resource Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage team capacity, skills, and assignments</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1" aria-label="Resource management tabs">
          <TabButton 
            active={activeTab === "overview"} 
            onClick={() => setActiveTab("overview")}
            icon={<BarChart3 className="h-4 w-4" />}
          >
            Overview
          </TabButton>
          <TabButton 
            active={activeTab === "by-project"} 
            onClick={() => setActiveTab("by-project")}
            icon={<Briefcase className="h-4 w-4" />}
          >
            By Project
          </TabButton>
          <TabButton 
            active={activeTab === "by-skill"} 
            onClick={() => setActiveTab("by-skill")}
            icon={<GraduationCap className="h-4 w-4" />}
          >
            By Skill
          </TabButton>
          <TabButton 
            active={activeTab === "bench"} 
            onClick={() => setActiveTab("bench")}
            icon={<UserMinus className="h-4 w-4" />}
          >
            Bench
          </TabButton>
          <TabButton 
            active={activeTab === "import-export"} 
            onClick={() => setActiveTab("import-export")}
            icon={<Upload className="h-4 w-4" />}
          >
            Import/Export
          </TabButton>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && overview && (
        <OverviewTab data={overview} employees={employees} onTransfer={openTransferModal} />
      )}
      {activeTab === "by-project" && byProject && (
        <ByProjectTab data={byProject} onTransfer={openTransferModal} />
      )}
      {activeTab === "by-skill" && bySkill && (
        <BySkillTab data={bySkill} />
      )}
      {activeTab === "bench" && bench && (
        <BenchTab data={bench} onTransfer={openTransferModal} />
      )}
      {activeTab === "import-export" && (
        <ImportExportTab 
          entities={ENTITIES}
          importEntity={importEntity}
          setImportEntity={setImportEntity}
          importFile={importFile}
          setImportFile={setImportFile}
          handleFileChange={handleFileChange}
          handleValidate={handleValidate}
          handleConfirmImport={handleConfirmImport}
          handleDownloadTemplate={handleDownloadTemplate}
          handleExport={handleExport}
          exportEntity={exportEntity}
          setExportEntity={setExportEntity}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          validating={validating}
          importing={importing}
          downloadingTemplate={downloadingTemplate}
          exporting={exporting}
          validationReport={validationReport}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
        />
      )}

      {/* Transfer Modal */}
      <ResourceTransferModal
        isOpen={transferModalOpen}
        onClose={handleTransferComplete}
        defaultEmployeeId={transferEmployeeId || undefined}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        active
          ? "bg-white dark:bg-gray-800 border-b-2 border-transparent text-blue-600 dark:text-blue-400"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ImportExportTab({
  entities,
  importEntity,
  setImportEntity,
  importFile,
  setImportFile,
  handleFileChange,
  handleValidate,
  handleConfirmImport,
  handleDownloadTemplate,
  handleExport,
  exportEntity,
  setExportEntity,
  exportFormat,
  setExportFormat,
  validating,
  importing,
  downloadingTemplate,
  exporting,
  validationReport,
  showConfirm,
  setShowConfirm,
}: any) {
  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card className="shadow dark:border-gray-700">
        <h3 className="font-semibold dark:text-white mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-500" />
          Bulk Import
        </h3>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium dark:text-white mb-1">Entity Type</label>
              <select
                className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={importEntity}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setImportEntity(e.target.value as any)}
              >
                {entities.map((e: { value: string; label: string }) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-white mb-1">Template</label>
              <button
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
                className="w-full flex items-center justify-center gap-2 rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FileText className="h-4 w-4" />
                <span>Download {importEntity} Template</span>
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-white mb-1">Upload File</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className={`flex items-center justify-center gap-2 rounded border-2 border-dashed p-4 transition-colors ${
                  importFile ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"
                }`}>
                  {importFile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-blue-700 dark:text-blue-300">{importFile.name}</span>
                      <button
                        onClick={() => setImportFile(null)}
                        className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Upload className="h-8 w-8" />
                      <span>Click to upload CSV or Excel file</span>
                      <span className="text-xs">Max 10MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {importFile && (
            <div className="flex gap-3">
              <button
                onClick={handleValidate}
                disabled={validating}
                className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Validate File
                  </>
                )}
              </button>
            </div>
          )}

          {validationReport && (
            <div className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <h4 className="font-medium dark:text-white">Validation Report</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${validationReport.valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {validationReport.valid ? "Valid" : "Has Errors"}
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-3 text-sm">
                <div className="p-2 rounded bg-gray-50 dark:bg-gray-700">
                  <span className="text-gray-500">Total Rows:</span>
                  <span className="ml-2 font-medium dark:text-white">{validationReport.totalRows}</span>
                </div>
                <div className="p-2 rounded bg-gray-50 dark:bg-gray-700">
                  <span className="text-gray-500">Valid Rows:</span>
                  <span className="ml-2 font-medium text-green-600">{validationReport.validRows}</span>
                </div>
                <div className="p-2 rounded bg-gray-50 dark:bg-gray-700">
                  <span className="text-gray-500">Errors:</span>
                  <span className="ml-2 font-medium text-red-600">{validationReport.errors.length}</span>
                </div>
              </div>
              {validationReport.errors.length > 0 && (
                <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <h5 className="font-medium text-red-700 dark:text-red-300 mb-2">Errors:</h5>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {validationReport.errors.slice(0, 10).map((err: any, i: number) => (
                      <li key={i} className="text-xs text-red-600 dark:text-red-400">
                        Row {err.row}, {err.field}: {err.message}
                      </li>
                    ))}
                    {validationReport.errors.length > 10 && (
                      <li className="text-xs text-red-500">... and {validationReport.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
              {validationReport.warnings.length > 0 && (
                <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <h5 className="font-medium text-amber-700 dark:text-amber-300 mb-2">Warnings:</h5>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {validationReport.warnings.slice(0, 5).map((warn: any, i: number) => (
                      <li key={i} className="text-xs text-amber-600 dark:text-amber-400">
                        Row {warn.row}, {warn.field}: {warn.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {validationReport.valid && showConfirm && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Confirm Import
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="rounded border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Export Section */}
      <Card className="shadow dark:border-gray-700">
        <h3 className="font-semibold dark:text-white mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-green-500" />
          Bulk Export
        </h3>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium dark:text-white mb-1">Entity to Export</label>
              <select
                className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={exportEntity}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExportEntity(e.target.value as any)}
              >
                {entities.map((e: { value: string; label: string }) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-white mb-1">Format</label>
              <select
                className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as "csv" | "xlsx")}
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function OverviewTab({ data, employees }: { data: any; employees?: any[]; onTransfer?: (employeeId: number) => void }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={data.totalEmployees}
          icon={<Users className="h-6 w-6 text-blue-500" />}
          trend={`${data.allocatedEmployees} allocated`}
        />
        <StatCard
          title="Available"
          value={data.availableEmployees}
          icon={<UserCheck className="h-6 w-6 text-green-500" />}
          trend={`${data.benchEmployees} on bench`}
        />
        <StatCard
          title="Vacant Seats"
          value={data.vacantProjectSeats}
          icon={<UserPlus className="h-6 w-6 text-amber-500" />}
          trend="Open positions"
        />
        <StatCard
          title="Utilization"
          value={`${data.overallUtilization}%`}
          icon={<Target className="h-6 w-6 text-purple-500" />}
          trend={data.overallUtilization > 80 ? "High" : data.overallUtilization > 50 ? "Moderate" : "Low"}
          trendColor={data.overallUtilization > 80 ? "text-red-500" : data.overallUtilization > 50 ? "text-amber-500" : "text-green-500"}
        />
      </div>

      {/* Skill Distribution & Employee List */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow dark:border-gray-700">
          <h3 className="font-semibold dark:text-white mb-4">Skill Distribution</h3>
          {data.skillDistribution.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No skill data available</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.skillDistribution.slice(0, 15).map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <span className="font-medium dark:text-white">{s.skill}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{s.count} employees</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="shadow dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold dark:text-white">All Employees</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{employees?.length || 0} total</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {employees?.slice(0, 20).map((emp: any) => (
              <EmployeeRow key={emp.userId} employee={emp} />
            ))}
            {(employees?.length || 0) > 20 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                +{(employees?.length ?? 0) - 20} more employees
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ByProjectTab({ data, onTransfer }: { data: any[]; onTransfer?: (employeeId: number) => void }) {
  return (
    <div className="space-y-6">
      {data.length === 0 ? (
        <Card className="shadow dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No project data available</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((project) => (
            <Card key={project.projectId} className="shadow dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Briefcase className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold dark:text-white">{project.projectName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{project.projectKey ?? project.projectId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <UtilizationBadge value={project.utilizationPercentage} />
                  </div>
                </div>
              </div>
              <div className="p-4 grid gap-4 md:grid-cols-4">
                <MetricBox label="Capacity" value={project.capacity} icon={<Target className="h-4 w-4" />} />
                <MetricBox label="Allocated" value={project.allocatedResources} icon={<UserCheck className="h-4 w-4" />} />
                <MetricBox label="Vacant" value={project.vacantSeats} icon={<UserPlus className="h-4 w-4" />} />
                <MetricBox label="Utilization" value={`${project.utilizationPercentage}%`} icon={<Zap className="h-4 w-4" />} />
              </div>
              {project.requiredSkills.length > 0 && (
                <div className="px-4 pb-4">
                  <p className="text-sm font-medium dark:text-white mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.slice(0, 8).map((skill: string, i: number) => (
                      <span key={i} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {project.employees.length > 0 && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium dark:text-white mb-2">Team Members:</p>
                  <div className="space-y-2">
                    {project.employees.map((emp: any) => (
                      <div key={emp.userId} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{emp.role}</span>
                          <span className="dark:text-white">{emp.username}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {emp.skills.slice(0, 3).map((s: any, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {s.skillName}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BySkillTab({ data }: { data: any[] }) {
  return (
    <div className="space-y-6">
      {data.length === 0 ? (
        <Card className="shadow dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No skill data available</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((skill) => (
            <Card key={skill.skill} className="shadow dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold dark:text-white">{skill.skill}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{skill.total} total</span>
              </div>
              <div className="space-y-3">
                <SkillMetric label="Total" value={skill.total} color="blue" icon={<Users className="h-4 w-4" />} />
                <SkillMetric label="Allocated" value={skill.allocated} color="purple" icon={<UserCheck className="h-4 w-4" />} />
                <SkillMetric label="Available" value={skill.available} color="green" icon={<UserPlus className="h-4 w-4" />} />
                <SkillMetric label="Bench" value={skill.bench} color="amber" icon={<UserMinus className="h-4 w-4" />} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BenchTab({ data, onTransfer }: { data: any[]; onTransfer?: (employeeId: number) => void }) {
  return (
    <div className="space-y-6">
      {data.length === 0 ? (
        <Card className="shadow dark:border-gray-700">
          <div className="text-center py-12">
            <UserMinus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold dark:text-white mb-2">No Bench Candidates</h3>
            <p className="text-gray-500 dark:text-gray-400">All employees are currently assigned to projects</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((candidate) => (
            <Card key={candidate.userId} className="shadow dark:border-gray-700">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <UserMinus className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold dark:text-white">{candidate.username}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.email}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          {candidate.availability === "BENCH" ? "On Bench" : "Unassigned"}
                        </span>
                        {candidate.experienceLevel && (
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {candidate.experienceLevel}
                          </span>
                        )}
                        {candidate.benchDate && (
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            Bench since {formatDistanceToNow(new Date(candidate.benchDate), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Previous: {candidate.previousProject ?? "None"}</p>
                  </div>
                </div>
                
                {candidate.skills.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium dark:text-white mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.slice(0, 8).map((s: any, i: number) => (
                        <span key={i} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {s.skillName} ({s.level})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {candidate.potentialMatches.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-gray-700">
                    <p className="text-sm font-medium dark:text-white mb-2">Potential Matches:</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.potentialMatches.map((match: any, i: number) => (
                        <span key={i} className="px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          Project #{match.projectId}: {match.matchReason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendColor = "text-gray-500" }: { title: string; value: number | string; icon: React.ReactNode; trend: string; trendColor?: string }) {
  return (
    <Card className="shadow dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold dark:text-white mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">{icon}</div>
      </div>
      <p className={`text-xs mt-3 ${trendColor}`}>{trend}</p>
    </Card>
  );
}

function MetricBox({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className="p-2 rounded bg-white dark:bg-gray-700">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function SkillMetric({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  const colors: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", icon: "text-blue-500" },
    purple: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", icon: "text-purple-500" },
    green: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: "text-green-500" },
    amber: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", icon: "text-amber-500" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className={`p-2 rounded ${c.bg}`}><span className={c.icon}>{icon}</span></div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`font-semibold ${c.text}`}>{value}</p>
      </div>
    </div>
  );
}

function EmployeeRow({ employee }: { employee: any }) {
  return (
    <div className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {employee.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-medium dark:text-white truncate">{employee.username}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            {employee.experienceLevel && <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700">{employee.experienceLevel}</span>}
            {employee.availability && <span className={`px-1.5 py-0.5 rounded text-xs ${employee.availability === "BENCH" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{employee.availability}</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {employee.skills.slice(0, 3).map((s: any, i: number) => (
          <span key={i} className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {s.skillName}
          </span>
        ))}
        {employee.skills.length > 3 && (
          <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
            +{employee.skills.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

function UtilizationBadge({ value }: { value: number }) {
  const color = value > 100 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : value > 80 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {value}% utilized
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default ResourceManagement;