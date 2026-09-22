import { Button, Input, Select } from "@/components/ui";
import Modal from "@/components/Modal";
import { useGetUsersQuery } from "@/state/api";
import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  currentMembers: any[];
  onAddMember: (userId: number, role: string) => void;
  onRemoveMember: (membershipId: number) => void;
  onUpdateRole: (membershipId: number, role: string) => void;
};

const ModalManageMembers = ({ 
  isOpen, 
  onClose, 
  projectId, 
  currentMembers,
  onAddMember,
  onRemoveMember,
  onUpdateRole 
}: Props) => {
  const { data: users } = useGetUsersQuery();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");

  const availableUsers = users?.filter(
    (user) => !currentMembers.some((member) => member.userId === user.userId)
  ) || [];

  const handleAddMember = () => {
    if (selectedUserId) {
      onAddMember(Number(selectedUserId), selectedRole);
      setSelectedUserId("");
      setSelectedRole("MEMBER");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Manage Project Members">
      <div className="mt-4 space-y-6">
        {/* Add New Member */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-3">Add New Member</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Select User"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select a user...</option>
              {availableUsers.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.username}
                </option>
              ))}
            </Select>
            <Select
              label="Role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="MEMBER">Member</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
            </Select>
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={handleAddMember}
                disabled={!selectedUserId}
                className="w-full"
              >
                Add Member
              </Button>
            </div>
          </div>
        </div>

        {/* Current Members */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Current Members ({currentMembers.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{member.user?.username}</p>
                    <p className="text-sm text-gray-500">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onChange={(e) => onUpdateRole(member.id, e.target.value)}
                    className="w-32"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </Select>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onRemoveMember(member.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {currentMembers.length === 0 && (
              <p className="text-gray-500 text-center py-4">No members yet</p>
            )}
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default ModalManageMembers;