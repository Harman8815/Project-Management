import { User } from "@/state/api";
import { Card } from "@/components/ui";
import { profilePictureSrc } from "@/lib/utils";
import Image from "next/image";
import React from "react";

type Props = {
  user: User;
};

const UserCard = ({ user }: Props) => {
  const avatarSrc = profilePictureSrc(user.profilePictureUrl);

  return (
    <Card className="flex items-center gap-4 border border-gray-200 shadow dark:border-gray-700">
      {avatarSrc && (
        <Image
          src={avatarSrc}
          alt="profile picture"
          width={32}
          height={32}
          unoptimized
          className="rounded-full"
        />
      )}
      <div>
        <h3 className="font-medium dark:text-white">{user.username}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {user.email}
        </p>
      </div>
    </Card>
  );
};

export default UserCard;
