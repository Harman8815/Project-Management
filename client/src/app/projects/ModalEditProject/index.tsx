import { Button, Input, Textarea, Select } from "@/components/ui";
import Modal from "@/components/Modal";
import { useUpdateProjectMutation } from "@/state/api";
import React, { useState, useEffect } from "react";
import { formatISO, parseISO } from "date-fns";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  project: any;
};

const ModalEditProject = ({ isOpen, onClose, project }: Props) => {
  const [updateProject, { isLoading }] = useUpdateProjectMutation();
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [objectives, setObjectives] = useState("");
  const [status, setStatus] = useState("PLANNED");

  useEffect(() => {
    if (project) {
      setProjectName(project.name || "");
      setProjectKey(project.key || "");
      setDescription(project.description || "");
      setPriority(project.priority || "MEDIUM");
      setObjectives(project.objectives || "");
      setStatus(project.status || "PLANNED");
      
      if (project.startDate) {
        setStartDate(parseISO(project.startDate).toISOString().split('T')[0]);
      }
      if (project.endDate) {
        setEndDate(parseISO(project.endDate).toISOString().split('T')[0]);
      }
      if (project.dueDate) {
        setDueDate(parseISO(project.dueDate).toISOString().split('T')[0]);
      }
    }
  }, [project]);

  const handleSubmit = async () => {
    if (!projectName || !startDate || !endDate) return;

    const formattedStartDate = formatISO(new Date(startDate), {
      representation: "complete",
    });
    const formattedEndDate = formatISO(new Date(endDate), {
      representation: "complete",
    });
    const formattedDueDate = dueDate ? formatISO(new Date(dueDate), {
      representation: "complete",
    }) : undefined;

    await updateProject({
      id: project.id,
      updates: {
        name: projectName,
        key: projectKey || undefined,
        description,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        dueDate: formattedDueDate,
        status,
        priority,
        objectives,
      },
    }).then(() => {
      onClose();
    });
  };

  const isFormValid = () => {
    return projectName && startDate && endDate;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Edit Project">
      <form
        className="mt-4 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
          <Input
            type="text"
            label="Project Name"
            placeholder="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
          <Input
            type="text"
            label="Project Key (Optional)"
            placeholder="PROJ"
            value={projectKey}
            onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
          />
        </div>
        <Textarea
          label="Description"
          placeholder="Describe your project..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Textarea
          label="Objectives"
          placeholder="What are the main objectives of this project?"
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-2">
          <Input
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
          <Input
            type="date"
            label="Due Date (Optional)"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="BACKLOG">Backlog</option>
          </Select>
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={!isFormValid() || isLoading}
          className="w-full"
        >
          {isLoading ? "Updating..." : "Update Project"}
        </Button>
      </form>
    </Modal>
  );
};

export default ModalEditProject;