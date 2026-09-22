"use client";

import React, { useState } from "react";
import ProjectHeader from "@/app/projects/ProjectHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Board from "../BoardView";
import List from "../ListView";
import Timeline from "../TimelineView";
import Table from "../TableView";
import ModalNewTask from "@/components/ModalNewTask";
import { useGetProjectsQuery } from "@/state/api";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

const Project = () => {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);
  const { data: projects } = useGetProjectsQuery();
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

  return (
    <div>
      <div className="p-4">
        <Breadcrumbs items={breadcrumbItems} />
        <ModalNewTask
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
