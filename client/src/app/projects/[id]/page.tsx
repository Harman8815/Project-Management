"use client";

import React, { useState } from "react";
import ProjectHeader from "@/app/projects/ProjectHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CardSkeleton } from "@/components/ui";
import Board from "../BoardView";
import List from "../ListView";
import Timeline from "../TimelineView";
import Table from "../TableView";
import TaskForm from "@/components/TaskForm";
import { useGetProjectsQuery } from "@/state/api";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

const Project = () => {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
  const { data: projects, isLoading } = useGetProjectsQuery();
  const projectName =
    projects?.find((p) => p.id === Number(id))?.name ?? "Project";

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: projectName },
  ];

  const handleTabChange = (tab: string) => {
    if (tab === "Overview") {
      router.push(`/projects/${id}/overview`);
    } else {
      setActiveTab(tab);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <Breadcrumbs items={breadcrumbItems} />
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div>
      <div className="p-4">
        <Breadcrumbs items={breadcrumbItems} />
        <TaskForm
          isOpen={isModalNewTaskOpen}
          onClose={() => setIsModalNewTaskOpen(false)}
          id={id}
        />
        <ProjectHeader
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          projectName={projectName}
        />
        {activeTab === "Board" && (
          <Board id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
        )}
        {activeTab === "List" && (
          <List id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
        )}
        {activeTab === "Timeline" && (
          <Timeline id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
        )}
        {activeTab === "Table" && (
          <Table id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
        )}
      </div>
    </div>
  );
};

export default Project;
