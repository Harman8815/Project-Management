import { PaginationDto } from "../dto/pagination.dto";

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  query: PaginationDto,
): PaginatedResult<T> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 10));
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const take = limit;

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    skip,
    take,
  } as PaginatedResult<T> & { skip: number; take: number };
}

export function getPaginationParams(query: PaginationDto): { skip: number; take: number } {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 10));
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}
