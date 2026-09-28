"use client";

import Header from "@/components/Header";
import { Input, LoadingState, ErrorState, EmptyState, CardSkeleton, Skeleton } from "@/components/ui";
import ProjectCard from "@/components/ProjectCard";
import TaskCard from "@/components/TaskCard";
import UserCard from "@/components/UserCard";
import { useGetAuthUserQuery, useSearchQuery, useGetRecentSearchesQuery, useGetTopSearchesQuery, useClearRecentSearchesMutation } from "@/state/api";
import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

const Search = () => {
  const { data: currentUser, isLoading: userLoading } = useGetAuthUserQuery({});
  const userId = currentUser?.userDetails?.userId;
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const isSearchActive = searchTerm.trim().length >= 3;
  const {
    data: searchResults,
    isFetching,
    isError,
  } = useSearchQuery(searchTerm, {
    skip: !isSearchActive,
  });

  const { data: recentSearches = [], isLoading: recentLoading } = useGetRecentSearchesQuery(userId ?? 0, {
    skip: !userId,
  });
  const { data: topSearches = [], isLoading: topLoading } = useGetTopSearchesQuery({ period: "week", limit: 10 });
  const [clearRecent] = useClearRecentSearchesMutation();

  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value);
      }, 500),
    [],
  );

  useEffect(() => {
    return () => {
      handleSearch.cancel();
    };
  }, [handleSearch]);

  const onSearchInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInputValue(value);
      handleSearch(value);
    },
    [handleSearch],
  );

  const applySearchTerm = (term: string) => {
    handleSearch.cancel();
    setInputValue(term);
    setSearchTerm(term);
  };

  const isSearchLoading = isSearchActive && isFetching;
  const hasResults =
    searchResults &&
    ((searchResults.tasks?.length ?? 0) > 0 ||
      (searchResults.projects?.length ?? 0) > 0 ||
      (searchResults.users?.length ?? 0) > 0);

  const shouldShowEmpty =
    !isSearchLoading && !isError && !hasResults && isSearchActive;
  const showHints = !isSearchActive;

  return (
    <div className="p-8">
      <Header name="Search" />
      <div>
        <Input
          type="text"
          placeholder="Search..."
          className="w-1/2"
          value={inputValue}
          onChange={onSearchInputChange}
        />
      </div>

      {showHints && !userLoading && (
        <div className="mt-6 space-y-6">
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold dark:text-white">Recent searches</h2>
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={async () => {
                    if (userId) await clearRecent(userId).unwrap();
                  }}
                >
                  Clear all
                </button>
              </div>
              {recentLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                      onClick={() => applySearchTerm(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold dark:text-white">Top searches this week</h2>
            {topLoading ? (
              <CardSkeleton count={3} />
            ) : (
              <div className="mt-2 space-y-2">
                {topSearches.map((s, i) => (
                  <div key={s.query} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">#{i + 1}</span>
                    <button
                      className="text-left text-sm text-gray-700 hover:underline dark:text-gray-300"
                      onClick={() => applySearchTerm(s.query)}
                    >
                      {s.query}
                    </button>
                    <span className="text-xs text-gray-400">({s.count} searches)</span>
                  </div>
                ))}
                {topSearches.length === 0 && <p className="text-sm text-gray-500">No popular searches yet.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative p-5">
        {isSearchLoading && (
          <div className="absolute inset-x-5 top-5 z-10">
            <LoadingState message="Searching..." size="sm" />
          </div>
        )}
        {isSearchLoading ? (
          <div className="pt-10">
            <CardSkeleton count={3} />
          </div>
        ) : null}
        {isError && (
          <ErrorState
            message="Error occurred while fetching search results"
            onRetry={() => window.location.reload()}
          />
        )}
        {shouldShowEmpty && (
          <EmptyState message="No search results found. Try a different search term." />
        )}
        {!isSearchLoading && !isError && searchResults && hasResults && (
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
