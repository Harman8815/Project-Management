"use client";

import Header from "@/components/Header";
import { Input, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import ProjectCard from "@/components/ProjectCard";
import TaskCard from "@/components/TaskCard";
import UserCard from "@/components/UserCard";
import { useSearchQuery } from "@/state/api";
import { debounce } from "lodash";
import React, { useEffect, useState } from "react";

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: searchResults,
    isLoading,
    isError,
  } = useSearchQuery(searchTerm, {
    skip: searchTerm.length < 3,
  });

  const handleSearch = debounce(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
    },
    500,
  );

  useEffect(() => {
    return () => {
      handleSearch.cancel();
    };
  }, [handleSearch]);

  const hasResults =
    searchResults &&
    ((searchResults.tasks?.length ?? 0) > 0 ||
      (searchResults.projects?.length ?? 0) > 0 ||
      (searchResults.users?.length ?? 0) > 0);

  const shouldShowEmpty = !isLoading && !isError && !hasResults;

  return (
    <div className="p-8">
      <Header name="Search" />
      <div>
        <Input
          type="text"
          placeholder="Search..."
          className="w-1/2"
          onChange={handleSearch}
        />
      </div>
      <div className="p-5">
        {isLoading && <LoadingState message="Searching..." />}
        {isError && (
          <ErrorState
            message="Error occurred while fetching search results"
            onRetry={() => window.location.reload()}
          />
        )}
        {shouldShowEmpty && (
          <EmptyState message="No search results found. Try a different search term." />
        )}
        {!isLoading && !isError && searchResults && hasResults && (
          <div>
            {searchResults.tasks && searchResults.tasks?.length > 0 && (
              <h2 className="mb-2 text-lg font-semibold dark:text-white">
                Tasks
              </h2>
            )}
            {searchResults.tasks?.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}

            {searchResults.projects && searchResults.projects?.length > 0 && (
              <h2 className="mb-2 text-lg font-semibold dark:text-white">
                Projects
              </h2>
            )}
            {searchResults.projects?.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}

            {searchResults.users && searchResults.users?.length > 0 && (
              <h2 className="mb-2 text-lg font-semibold dark:text-white">
                Users
              </h2>
            )}
            {searchResults.users?.map((user) => (
              <UserCard key={user.userId} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
