import { Project } from "@/state/api";
import { Card } from "@/components/ui";
import React from "react";

type Props = {
  project: Project;
};

const ProjectCard = ({ project }: Props) => {
  return (
    <Card
      title={project.name}
      className="border border-gray-200 shadow dark:border-gray-700"
    >
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {project.description}
      </p>
      <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>Start: {project.startDate ?? "Not set"}</span>
        <span>End: {project.endDate ?? "Not set"}</span>
      </div>
    </Card>
  );
};

export default ProjectCard;
