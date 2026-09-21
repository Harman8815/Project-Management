"use client";

import Header from "@/components/Header";
import { useAskAiMutation } from "@/state/api";
import { Bot, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";

const organizationId = 1;

export default function AssistantPage() {
  const [prompt, setPrompt] = useState("");
  const [projectId, setProjectId] = useState("");
  const [answer, setAnswer] = useState<{ answer: string; sources: Array<{ type: string; id: number }> }>();
  const [ask, { isLoading, error }] = useAskAiMutation();

  const submit = async () => {
    if (!prompt.trim()) return;
    const result = await ask({ organizationId, prompt, projectId: projectId ? Number(projectId) : undefined }).unwrap();
    setAnswer(result);
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <Header name="Project assistant" />
      <section className="rounded border bg-slate-950 p-6 text-white shadow-sm"><div className="flex items-center gap-3"><Bot size={24} /><div><h2 className="text-xl font-semibold">Grounded project help</h2><p className="text-sm text-slate-300">Ask about status, risks, tasks, milestones, or sprint planning.</p></div></div></section>
      <section className="rounded border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"><div className="grid gap-4 md:grid-cols-[160px_1fr]"><label className="text-sm font-medium">Project ID<input className="mt-2 w-full rounded border p-2 dark:bg-gray-800" value={projectId} onChange={(event) => setProjectId(event.target.value)} placeholder="Optional" inputMode="numeric" /></label><label className="text-sm font-medium">Question<textarea className="mt-2 min-h-28 w-full rounded border p-2 dark:bg-gray-800" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="What is the current project risk?" maxLength={4000} /></label></div><div className="mt-4 flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-gray-500"><ShieldCheck size={15} /> Answers are limited to your organization access</span><button className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50" onClick={submit} disabled={isLoading || !prompt.trim()}><Send size={16} /> {isLoading ? "Thinking..." : "Ask assistant"}</button></div></section>
      {error && <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">The assistant could not answer this request.</p>}
      {answer && <section className="rounded border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"><h2 className="font-semibold">Answer</h2><p className="mt-3 leading-7 text-gray-700 dark:text-gray-200">{answer.answer}</p>{answer.sources.length > 0 && <p className="mt-4 text-xs text-gray-500">Source: {answer.sources.map((source) => `${source.type} #${source.id}`).join(", ")}</p>}</section>}
    </main>
  );
}
