"use client";

import Header from "@/components/Header";
import { CardSkeleton, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { toast } from "@/components/ui/toast";
import {
  useCreateCustomFieldMutation,
  useCreateIntegrationMutation,
  useGetCustomFieldsQuery,
  useGetOrganizationQuery,
  useGetAuthUserQuery,
  useUpdateOrganizationSettingsMutation,
  useSetCustomFieldValueMutation,
  useGetCustomFieldValuesQuery,
} from "@/state/api";
import { Save, ShieldCheck, SlidersHorizontal, Webhook, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Database, FileText, Calendar, CheckSquare, Hash, ToggleLeft, User, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

const FIELD_TYPE_OPTIONS = [
  { value: "TEXT", label: "Text", icon: <FileText className="h-4 w-4" /> },
  { value: "NUMBER", label: "Number", icon: <Hash className="h-4 w-4" /> },
  { value: "BOOLEAN", label: "Boolean", icon: <ToggleLeft className="h-4 w-4" /> },
  { value: "DATE", label: "Date", icon: <Calendar className="h-4 w-4" /> },
  { value: "SELECT", label: "Select (dropdown)", icon: <ChevronDown className="h-4 w-4" /> },
  { value: "MULTI_SELECT", label: "Multi-select", icon: <Tag className="h-4 w-4" /> },
  { value: "USER", label: "User picker", icon: <User className="h-4 w-4" /> },
];

export default function OrganizationPage() {
  const {
    data: currentUser,
    isLoading: userLoading,
    isError: userError,
  } = useGetAuthUserQuery({});
  const membership = currentUser?.userDetails?.organizationMemberships?.find(
    (m) => Boolean(m?.organizationId),
  );
  const orgId = membership?.organizationId ?? 0;
  const userRole = membership?.role ?? "";
  const isAdminOrOwner = ["ADMIN", "OWNER"].includes(userRole);

  const {
    data: organization,
    isLoading,
    isError,
  } = useGetOrganizationQuery(orgId, {
    skip: !orgId,
  });
  const {
    data: fields = [],
    isLoading: fieldsLoading,
    isError: fieldsError,
  } = useGetCustomFieldsQuery(orgId, {
    skip: !orgId,
  });
  const [updateSettings, settingsState] = useUpdateOrganizationSettingsMutation();
  const [createField, fieldState] = useCreateCustomFieldMutation();
  const [setFieldValue, setFieldValueState] = useSetCustomFieldValueMutation();
  const [createIntegration, integrationState] = useCreateIntegrationMutation();
  
  const [retention, setRetention] = useState("90");
  const [fieldName, setFieldName] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [fieldOptions, setFieldOptions] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [provider, setProvider] = useState("github");
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; key: string; fieldType: string; options: string; required: boolean } | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);

  if (userLoading) {
    return (
      <main className="space-y-6 p-8">
        <Header name="Organization admin" />
        <CardSkeleton count={2} />
      </main>
    );
  }
  if (userError) {
    return (
      <main className="space-y-6 p-8">
        <Header name="Organization admin" />
        <ErrorState
          message="Failed to load your account"
          onRetry={() => window.location.reload()}
        />
      </main>
    );
  }
  if (!orgId) {
    return (
      <main className="space-y-6 p-8">
        <Header name="Organization admin" />
        <EmptyState message="You are not a member of any organization." />
      </main>
    );
  }
  if (isLoading) {
    return (
      <main className="space-y-6 p-8">
        <Header name="Organization admin" />
        <CardSkeleton count={3} />
      </main>
    );
  }
  if (isError || !organization) return <main className="p-8">Organization access is unavailable.</main>;

  const saveSettings = async () => {
    try {
      await updateSettings({ organizationId: orgId, settings: { auditRetentionDays: retention } }).unwrap();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const addField = async () => {
    if (!fieldName || !fieldKey) return;
    try {
      await createField({ 
        organizationId: orgId, 
        name: fieldName, 
        key: fieldKey, 
        fieldType,
        required: fieldRequired,
        options: fieldType === "SELECT" || fieldType === "MULTI_SELECT" ? fieldOptions : undefined,
      }).unwrap();
      setFieldName("");
      setFieldKey("");
      setFieldType("TEXT");
      setFieldOptions("");
      setFieldRequired(false);
      setShowFieldModal(false);
      toast.success("Custom field created");
    } catch {
      toast.error("Failed to create custom field");
    }
  };

  const startEditField = (field: any) => {
    setEditingFieldId(field.id);
    setEditForm({
      name: field.name,
      key: field.key,
      fieldType: field.fieldType,
      options: field.options || "",
      required: field.required,
    });
  };

  const saveEditField = async (fieldId: number) => {
    if (!editForm) return;
    try {
      // Note: Backend would need an update endpoint for this
      toast.info("Field update requires backend endpoint implementation");
      setEditingFieldId(null);
      setEditForm(null);
    } catch {
      toast.error("Failed to update custom field");
    }
  };

  const deleteField = async (fieldId: number) => {
    if (!confirm("Delete this custom field? This will remove all associated values.")) return;
    // Note: Backend would need a delete endpoint
    toast.info("Field deletion requires backend endpoint implementation");
  };

  const connectIntegration = async () => {
    try {
      await createIntegration({ organizationId: orgId, provider, name: `${provider} workspace` }).unwrap();
      toast.success(`${provider} integration configured`);
    } catch {
      toast.error(`Failed to configure ${provider} integration`);
    }
  };

  return (
    <main className="space-y-6 p-8">
      <Header name="Organization admin" />
      <p className="text-sm text-gray-500">{organization.name} · {organization.slug}</p>
      
      <section className="grid gap-6 xl:grid-cols-3">
        <Panel icon={ShieldCheck} title="Members and roles">
          <div className="space-y-2">
            {organization.memberships.map((member) => (
              <div
                className="flex justify-between rounded bg-gray-50 p-3 text-sm dark:bg-gray-800"
                key={member.userId}
              >
                <span>{member.user?.username ?? `User ${member.userId}`}</span>
                <strong className="text-gray-600 dark:text-gray-300">{member.role}</strong>
              </div>
            ))}
          </div>
        </Panel>
        
        <Panel icon={SlidersHorizontal} title="Organization settings">
          <label className="block text-sm font-medium dark:text-white mb-1">Audit retention (days)</label>
          <input className="mt-2 w-full rounded border p-2 dark:bg-gray-800" value={retention} onChange={(event) => setRetention(event.target.value)} type="number" min="1" />
          <button className="mt-4 flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={saveSettings} disabled={settingsState.isLoading}>
            <Save size={16} /> Save settings
          </button>
        </Panel>
        
        <Panel icon={Webhook} title="Integrations">
          <select className="w-full rounded border p-2 dark:bg-gray-800" value={provider} onChange={(event) => setProvider(event.target.value)}>
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
            <option value="calendar">Calendar</option>
          </select>
          <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white" onClick={connectIntegration} disabled={integrationState.isLoading}>
            Configure integration
          </button>
          {organization.integrations && organization.integrations.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium dark:text-white">Configured integrations</h3>
              {organization.integrations.map((integration) => (
                <div
                  className="flex items-center justify-between rounded bg-gray-50 p-3 text-sm dark:bg-gray-800"
                  key={integration.id}
                >
                  <div>
                    <span className="font-semibold">{integration.provider}</span>
                    <span className="mx-2 text-gray-400">·</span>
                    <span className="text-gray-600 dark:text-gray-300">{integration.name}</span>
                  </div>
                  <span className={`text-xs font-medium ${integration.enabled ? "text-green-600" : "text-gray-400"}`}>
                    {integration.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* Custom Fields Section */}
      <section className="rounded border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold dark:text-white">Custom Fields</h2>
          </div>
          {isAdminOrOwner && (
            <button
              onClick={() => { setShowFieldModal(true); setEditingFieldId(null); setEditForm(null); }}
              className="flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus size={16} /> Add Custom Field
            </button>
          )}
        </div>

        {/* Field Definition List */}
        <div className="divide-y">
          {fieldsLoading ? (
            <LoadingState message="Loading custom fields..." size="sm" />
          ) : fieldsError ? (
            <ErrorState
              message="Failed to load custom fields"
              onRetry={() => window.location.reload()}
            />
          ) : fields.length === 0 ? (
            <div className="py-8 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold dark:text-white mb-2">No custom fields configured</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create custom fields to extend projects and tasks with additional data</p>
              {isAdminOrOwner && (
                <button
                  onClick={() => setShowFieldModal(true)}
                  className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Plus size={16} /> Create First Field
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => (
                <CustomFieldRow 
                  key={field.id} 
                  field={field} 
                  isAdmin={isAdminOrOwner}
                  onEdit={startEditField}
                  onDelete={deleteField}
                  editing={editingFieldId === field.id}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  cancelEdit={() => { setEditingFieldId(null); setEditForm(null); }}
                  saveEdit={saveEditField}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Add/Edit Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold dark:text-white mb-4">
              {editingFieldId ? "Edit Custom Field" : "Add Custom Field"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">Field Name</label>
                <input
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Business Unit"
                  value={editingFieldId ? (editForm?.name || "") : fieldName}
                  onChange={(e) => editingFieldId ? setEditForm({...editForm!, name: e.target.value}) : setFieldName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">Field Key</label>
                <input
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., business_unit"
                  value={editingFieldId ? (editForm?.key || "") : fieldKey}
                  onChange={(e) => editingFieldId ? setEditForm({...editForm!, key: e.target.value}) : setFieldKey(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated from name, used for API</p>
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">Field Type</label>
                <select
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={editingFieldId ? (editForm?.fieldType || "TEXT") : fieldType}
                  onChange={(e) => editingFieldId ? setEditForm({...editForm!, fieldType: e.target.value}) : setFieldType(e.target.value)}
                >
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {(fieldType === "SELECT" || fieldType === "MULTI_SELECT" || (editingFieldId && editForm?.fieldType === "SELECT") || (editingFieldId && editForm?.fieldType === "MULTI_SELECT")) && (
                <div>
                  <label className="block text-sm font-medium dark:text-white mb-1">Options (comma-separated)</label>
                  <input
                    className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Option A, Option B, Option C"
                    value={editingFieldId ? (editForm?.options || "") : fieldOptions}
                    onChange={(e) => editingFieldId ? setEditForm({...editForm!, options: e.target.value}) : setFieldOptions(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter options separated by commas</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fieldRequired"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  checked={editingFieldId ? (editForm?.required || false) : fieldRequired}
                  onChange={(e) => editingFieldId ? setEditForm({...editForm!, required: e.target.checked}) : setFieldRequired(e.target.checked)}
                />
                <label htmlFor="fieldRequired" className="text-sm dark:text-white">Required field</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowFieldModal(false); setEditingFieldId(null); setEditForm(null); }}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={editingFieldId ? () => saveEditField(editingFieldId) : addField}
                className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                disabled={fieldState.isLoading}
              >
                {editingFieldId ? "Save Changes" : "Create Field"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CustomFieldRow({ 
  field, 
  isAdmin, 
  onEdit, 
  onDelete, 
  editing, 
  editForm, 
  setEditForm, 
  cancelEdit, 
  saveEdit 
}: { 
  field: any; 
  isAdmin: boolean; 
  onEdit: (field: any) => void; 
  onDelete: (id: number) => void; 
  editing: boolean; 
  editForm: any; 
  setEditForm: (form: any) => void; 
  cancelEdit: () => void; 
  saveEdit: (id: number) => void; 
}) {
  const getTypeIcon = (type: string) => {
    const opt = FIELD_TYPE_OPTIONS.find((o) => o.value === type);
    return opt?.icon || <FileText className="h-4 w-4" />;
  };

  if (editing && editForm) {
    return (
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="grid gap-3 md:grid-cols-4 mb-3">
          <input
            className="rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={editForm.name}
            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
          />
          <input
            className="rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={editForm.key}
            onChange={(e) => setEditForm({...editForm, key: e.target.value})}
          />
          <select
            className="rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={editForm.fieldType}
            onChange={(e) => setEditForm({...editForm, fieldType: e.target.value})}
          >
            {FIELD_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex items-end gap-2">
            <button
              onClick={() => saveEdit(field.id)}
              className="flex-1 rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-medium dark:border-gray-600 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
        {["SELECT", "MULTI_SELECT"].includes(editForm.fieldType) && (
          <div className="mb-3">
            <label className="block text-sm font-medium dark:text-white mb-1">Options (comma-separated)</label>
            <input
              className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Option A, Option B, Option C"
              value={editForm.options}
              onChange={(e) => setEditForm({...editForm, options: e.target.value})}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={editForm.required}
            onChange={(e) => setEditForm({...editForm, required: e.target.checked})}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <label className="text-sm dark:text-white">Required field</label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between py-3 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 rounded bg-gray-100 dark:bg-gray-700">
          {getTypeIcon(field.fieldType)}
        </div>
        <div className="min-w-0">
          <p className="font-medium dark:text-white truncate">{field.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{field.key}</span>
            <span className="px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{field.fieldType}</span>
            {field.required && <span className="px-2 py-0.5 rounded text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">Required</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {field.options && (
          <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
            {field.options}
          </span>
        )}
        {isAdmin && (
          <>
            <button
              onClick={() => onEdit(field)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(field.id)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: ReactNode }) {
  return (
    <section className="rounded border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={18} />
        <h2 className="font-semibold dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}