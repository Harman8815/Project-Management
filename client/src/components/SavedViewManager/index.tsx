"use client";

import { Card, ErrorState, LoadingState } from "@/components/ui";
import { useGetSavedViewsQuery, useGetDefaultSavedViewQuery, useCreateSavedViewMutation, useUpdateSavedViewMutation, useDeleteSavedViewMutation } from "@/state/api";
import { Save, Star, Trash2, Edit2, ChevronDown, Filter, SlidersHorizontal, Columns, Plus, X, Check } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/toast";

interface SavedViewManagerProps {
  viewType: string;
  currentFilters: any;
  currentSort?: any;
  currentColumns?: any;
  projectId?: number;
  onApplyView: (view: any) => void;
}

const SavedViewManager = ({ viewType, currentFilters, currentSort, currentColumns, projectId, onApplyView }: SavedViewManagerProps) => {
  const { data: views = [], isLoading, refetch } = useGetSavedViewsQuery({ viewType });
  const { data: defaultView } = useGetDefaultSavedViewQuery(viewType);
  const [createView, { isLoading: creating }] = useCreateSavedViewMutation();
  const [updateView, { isLoading: updating }] = useUpdateSavedViewMutation();
  const [deleteView] = useDeleteSavedViewMutation();
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingViewId, setEditingViewId] = useState<number | null>(null);
  const [viewName, setViewName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [expandedViewId, setExpandedViewId] = useState<number | null>(null);

  useEffect(() => {
    refetch();
  }, [viewType, refetch]);

  const handleSave = async () => {
    if (!viewName.trim()) return;
    
    try {
      if (editingViewId) {
        await updateView({ id: editingViewId, data: { viewName, isDefault } }).unwrap();
        toast.success("View updated");
      } else {
        await createView({ 
          viewName, 
          viewType, 
          filters: currentFilters, 
          sortConfig: currentSort, 
          columnConfig: currentColumns,
          isDefault,
        }).unwrap();
        toast.success("View saved");
      }
      setShowSaveModal(false);
      setEditingViewId(null);
      setViewName("");
      setIsDefault(false);
      refetch();
    } catch (error) {
      toast.error("Failed to save view");
    }
  };

  const handleApply = (view: any) => {
    onApplyView(view);
  };

  const handleSetDefault = async (view: any) => {
    try {
      await updateView({ id: view.id, data: { isDefault: !view.isDefault } }).unwrap();
      toast.success(view.isDefault ? "Default view removed" : "Set as default view");
      refetch();
    } catch (error) {
      toast.error("Failed to update default view");
    }
  };

  const handleDelete = async (view: any) => {
    if (!confirm(`Delete "${view.viewName}"?`)) return;
    try {
      await deleteView(view.id).unwrap();
      toast.success("View deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete view");
    }
  };

  const handleEdit = (view: any) => {
    setEditingViewId(view.id);
    setViewName(view.viewName);
    setIsDefault(view.isDefault);
    setShowSaveModal(true);
  };

  const openSaveModal = () => {
    setEditingViewId(null);
    setViewName("");
    setIsDefault(false);
    setShowSaveModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Save Current View Button */}
      <button
        onClick={openSaveModal}
        className="flex items-center gap-2 w-full px-4 py-2 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <Save className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium dark:text-white">Save Current View</span>
      </button>

      {/* Saved Views List */}
      {isLoading ? (
        <LoadingState />
      ) : views.length === 0 ? (
        <Card className="shadow dark:border-gray-700 p-6 text-center">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold dark:text-white mb-1">No saved views</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Save your filter and column configurations for quick access</p>
          <button
            onClick={openSaveModal}
            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Save First View
          </button>
        </Card>
      ) : (
        <div className="space-y-2">
          {views.map((view) => (
            <SavedViewCard
              key={view.id}
              view={view}
              isDefault={defaultView?.id === view.id}
              expanded={expandedViewId === view.id}
              onToggleExpand={() => setExpandedViewId(expandedViewId === view.id ? null : view.id)}
              onApply={() => handleApply(view)}
              onSetDefault={() => handleSetDefault(view)}
              onEdit={() => handleEdit(view)}
              onDelete={() => handleDelete(view)}
            />
          ))}
        </div>
      )}

      {/* Save/Edit Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold dark:text-white mb-4">
              {editingViewId ? "Edit Saved View" : "Save Current View"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">View Name</label>
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="My Custom View"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                <label htmlFor="isDefault" className="text-sm dark:text-white">
                  Set as default view for {viewType}
                </label>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                This will save: {Object.keys(currentFilters || {}).length} filters, 
                {currentSort ? "sort config, " : ""}
                {currentColumns ? "column config" : ""}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowSaveModal(false); setEditingViewId(null); setViewName(""); setIsDefault(false); }}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={creating || updating || !viewName.trim()}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating || updating ? "Saving..." : editingViewId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function SavedViewCard({ view, isDefault, expanded, onToggleExpand, onApply, onSetDefault, onEdit, onDelete }: any) {
  const filterCount = Object.keys(view.filters || {}).length;
  const hasSort = !!view.sortConfig;
  const hasColumns = !!view.columnConfig;

  return (
    <Card className={`shadow dark:border-gray-700 ${expanded ? "ring-2 ring-blue-500" : ""}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Filter className="h-5 w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium dark:text-white truncate">{view.viewName}</h4>
                {isDefault && (
                  <Star className="h-4 w-4 text-amber-500 fill-current" aria-label="Default view" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                <span>{filterCount} filter{filterCount !== 1 ? "s" : ""}</span>
                {hasSort && <span className="flex items-center gap-1"><SlidersHorizontal className="h-3 w-3" /> sorted</span>}
                {hasColumns && <span className="flex items-center gap-1"><Columns className="h-3 w-3" /> columns</span>}
                <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 capitalize">{view.viewType}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onApply}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600"
              title="Apply this view"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              title={expanded ? "Collapse" : "Expand"}
            >
              <ChevronDown className={`h-4 w-4 ${expanded ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={onSetDefault}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${isDefault ? "text-amber-500" : "text-gray-400 hover:text-amber-500"}`}
              title={isDefault ? "Remove as default" : "Set as default"}
            >
              <Star className={`h-4 w-4 ${isDefault ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 mt-2">
            <div className="grid gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-400">Filters:</span>
                <pre className="mt-1 p-2 rounded bg-gray-50 dark:bg-gray-700 overflow-auto text-xs max-h-32">
                  {JSON.stringify(view.filters, null, 2)}
                </pre>
              </div>
              {view.sortConfig && (
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Sort:</span>
                  <pre className="mt-1 p-2 rounded bg-gray-50 dark:bg-gray-700 overflow-auto text-xs">
                    {JSON.stringify(view.sortConfig, null, 2)}
                  </pre>
                </div>
              )}
              {view.columnConfig && (
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Columns:</span>
                  <pre className="mt-1 p-2 rounded bg-gray-50 dark:bg-gray-700 overflow-auto text-xs">
                    {JSON.stringify(view.columnConfig, null, 2)}
                  </pre>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Created: {new Date(view.createdAt).toLocaleDateString()}</span>
                <span>·</span>
                <span>Updated: {new Date(view.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default SavedViewManager;