import type { PaginationQuery } from "../validators/pagination.validator.js";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}

export const toSkip = ({ page, limit }: PaginationQuery): number => (page - 1) * limit;

export const buildPagination = (
  { page, limit }: PaginationQuery,
  total: number,
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const getPagination = (req: { query: unknown }): PaginationQuery =>
  req.query as PaginationQuery;
