import { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
}

export const getPaginationParams = (
  req: Request,
  options: PaginationOptions = {},
): PaginationParams => {
  const { defaultPage = 1, defaultLimit = 12, maxLimit = 48 } = options;

  let page = parseInt(req.query.page as string);
  let limit = parseInt(req.query.limit as string);

  if (isNaN(page) || page < 1) page = defaultPage;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;

  // Security: Clamp limit to prevent server overload
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const createPaginationResponse = (total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
