"use client";

import Header from "@/components/Header";
import {
  useCreateCustomFieldMutation,
  useCreateIntegrationMutation,
  useGetCustomFieldsQuery,
  useGetOrganizationQuery,
  useUpdateOrganizationSettingsMutation,
} from "@/state/api";
import { Save, ShieldCheck, SlidersHorizontal, Webhook } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

const organizationId = 1;

export default function OrganizationPage() {
  const { data: organization, isLoading, isError } = useGetOrganizationQuery(organizationId);
  const { data: fields = [] } = useGetCustomFieldsQuery(organizationId);
  const [updateSettings, settingsState] = useUpdateOrganizationSettingsMutation();
  const [createField, fieldState] = useCreateCustomFieldMutation();
  const [createIntegration, integrationState] = useCreateIntegrationMutation();
  const [retention, setRetention] = useState("90");
  const [fieldName, setFieldName] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [provider, setProvider] = useState("github");
  const [notice, setNotice] = useState("");

  if (isLoading) return <main className="p-8">Loading organization...</main>;
  if (isError || !organization) return <main className="p-8">Organization access is unavailable.</main>;

  const saveSettings = async () => {
    await updateSettings({ organizationId, settings: { auditRetentionDays: retention } }).unwrap();
    setNotice("Settings saved");
  };

  const addField = async () => {
    if (!fieldName || !fieldKey) return;
    await createField({ organizationId, name: fieldName, key: fieldKey, fieldType }).unwrap();
    setFieldName("");
    setFieldKey("");
    setNotice("Custom field created");
  };

  const connectIntegration = async () => {
    await createIntegration({ organizationId, provider, name: `${provider} workspace` }).unwrap();
    setNotice(`${provider} integration configured`);
  };

  return (
    <main className="space-y-6 p-8">
      <Header name="Organization admin" />
      <p className="text-sm text-gray-500">{organization.name} · {organization.slug}</p>
      {notice && <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      <section className="grid gap-6 xl:grid-cols-3">
        <Panel icon={ShieldCheck} title="Members and roles">
          <div className="space-y-2">{organization.memberships.map((member) => <div className="flex justify-between rounded bg-gray-50 p-3 text-sm dark:bg-gray-800" key={member.userId}><span>User {member.userId}</span><strong>{member.role}</strong></div>)}</div>
        </Panel>
        <Panel icon={SlidersHorizontal} title="Organization settings">
          <label className="text-sm font-medium">Audit retention (days)<input className="mt-2 w-full rounded border p-2 dark:bg-gray-800" value={retention} onChange={(event) => setRetention(event.target.value)} type="number" min="1" /></label>
          <button className="mt-4 flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={saveSettings} disabled={settingsState.isLoading}><Save size={16} /> Save settings</button>
        </Panel>
        <Panel icon={Webhook} title="Integrations">
          <select className="w-full rounded border p-2 dark:bg-gray-800" value={provider} onChange={(event) => setProvider(event.target.value)}><option value="github">GitHub</option><option value="gitlab">GitLab</option><option value="calendar">Calendar</option></select>
          <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white" onClick={connectIntegration} disabled={integrationState.isLoading}>Configure integration</button>
        </Panel>
      </section>
      <section className="rounded border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Custom fields</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4"><input className="rounded border p-2 dark:bg-gray-800" placeholder="Field name" value={fieldName} onChange={(event) => setFieldName(event.target.value)} /><input className="rounded border p-2 dark:bg-gray-800" placeholder="field_key" value={fieldKey} onChange={(event) => setFieldKey(event.target.value)} /><select className="rounded border p-2 dark:bg-gray-800" value={fieldType} onChange={(event) => setFieldType(event.target.value)}><option>TEXT</option><option>NUMBER</option><option>BOOLEAN</option><option>DATE</option><option>SELECT</option></select><button className="rounded bg-slate-900 px-4 py-2 font-semibold text-white" onClick={addField} disabled={fieldState.isLoading}>Add field</button></div>
        <div className="mt-4 divide-y">{fields.map((field) => <div className="flex justify-between py-3 text-sm" key={field.id}><span>{field.name} <span className="text-gray-400">({field.key})</span></span><span className="font-semibold">{field.fieldType}</span></div>)}{fields.length === 0 && <p className="py-4 text-sm text-gray-500">No custom fields configured.</p>}</div>
      </section>
    </main>
  );
}

function Panel({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: ReactNode }) {
  return <section className="rounded border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"><div className="mb-4 flex items-center gap-2"><Icon size={18} /><h2 className="font-semibold">{title}</h2></div>{children}</section>;
}
