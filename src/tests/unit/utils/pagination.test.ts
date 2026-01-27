import { Request } from "express";

import {
  createPaginationResponse,
  getPaginationParams,
  PaginationOptions,
} from "../../../utils/pagination";

describe("Pagination Utilities", () => {
  describe("getPaginationParams", () => {
    const createMockRequest = (query: Record<string, string | number | undefined> = {}): Request =>
      ({
        query,
      }) as Request;

    it("should return default values when no query parameters", () => {
      const req = createMockRequest();
      const result = getPaginationParams(req);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
      expect(result.skip).toBe(0); // (1-1)*12 = 0
    });

    it("should parse valid page and limit from query", () => {
      const req = createMockRequest({ page: "2", limit: "20" });
      const result = getPaginationParams(req);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(20); // (2-1)*20 = 20
    });

    it("should use custom default values when provided", () => {
      const req = createMockRequest();
      const options: PaginationOptions = {
        defaultPage: 3,
        defaultLimit: 25,
      };
      const result = getPaginationParams(req, options);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(25);
      expect(result.skip).toBe(50); // (3-1)*25 = 50
    });

    it("should handle invalid page parameter (non-number)", () => {
      const req = createMockRequest({ page: "invalid", limit: "10" });
      const result = getPaginationParams(req);

      expect(result.page).toBe(1); // default
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(0); // (1-1)*10 = 0
    });

    it("should handle invalid limit parameter (non-number)", () => {
      const req = createMockRequest({ page: "2", limit: "not-a-number" });
      const result = getPaginationParams(req);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(12); // default
      expect(result.skip).toBe(12); // (2-1)*12 = 12
    });

    it("should handle negative page parameter", () => {
      const req = createMockRequest({ page: "-5", limit: "10" });
      const result = getPaginationParams(req);

      expect(result.page).toBe(1); // default (page < 1)
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(0); // (1-1)*10 = 0
    });

    it("should handle zero page parameter", () => {
      const req = createMockRequest({ page: "0", limit: "10" });
      const result = getPaginationParams(req);

      expect(result.page).toBe(1); // default (page < 1)
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(0); // (1-1)*10 = 0
    });

    it("should respect maxLimit option when limit exceeds it", () => {
      const req = createMockRequest({ page: "1", limit: "100" });
      const result = getPaginationParams(req);

      expect(result.limit).toBe(48); // maxLimit default is 48
    });

    it("should respect custom maxLimit option", () => {
      const req = createMockRequest({ page: "1", limit: "200" });
      const options: PaginationOptions = { maxLimit: 50 };
      const result = getPaginationParams(req, options);

      expect(result.limit).toBe(50);
    });

    it("should calculate correct skip for various page and limit combinations", () => {
      const testCases = [
        { page: 1, limit: 10, expectedSkip: 0 },
        { page: 2, limit: 10, expectedSkip: 10 },
        { page: 3, limit: 5, expectedSkip: 10 },
        { page: 5, limit: 20, expectedSkip: 80 },
      ];

      testCases.forEach(({ page, limit, expectedSkip }) => {
        const req = createMockRequest({
          page: page.toString(),
          limit: limit.toString(),
        });
        const result = getPaginationParams(req);

        expect(result.skip).toBe(expectedSkip);
      });
    });

    it("should handle empty string parameters", () => {
      const req = createMockRequest({ page: "", limit: "" });
      const result = getPaginationParams(req);

      expect(result.page).toBe(1); // default
      expect(result.limit).toBe(12); // default
      expect(result.skip).toBe(0); // (1-1)*12 = 0
    });

    it("should handle undefined parameters", () => {
      const req = createMockRequest({ page: undefined, limit: undefined });
      const result = getPaginationParams(req);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
      expect(result.skip).toBe(0);
    });

    it("should handle parameters with whitespace", () => {
      const req = createMockRequest({ page: "  3  ", limit: "  15  " });
      const result = getPaginationParams(req);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(15);
      expect(result.skip).toBe(30); // (3-1)*15 = 30
    });
  });

  describe("createPaginationResponse", () => {
    it("should create correct pagination for first page", () => {
      const result = createPaginationResponse(100, 1, 10);

      expect(result.total).toBe(100);
      expect(result.totalPages).toBe(10);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(false);
    });

    it("should create correct pagination for middle page", () => {
      const result = createPaginationResponse(100, 5, 10);

      expect(result.total).toBe(100);
      expect(result.totalPages).toBe(10);
      expect(result.currentPage).toBe(5);
      expect(result.itemsPerPage).toBe(10);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(true);
    });

    it("should create correct pagination for last page", () => {
      const result = createPaginationResponse(95, 10, 10);

      expect(result.total).toBe(95);
      expect(result.totalPages).toBe(10);
      expect(result.currentPage).toBe(10);
      expect(result.itemsPerPage).toBe(10);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(true);
    });

    it("should handle zero total items", () => {
      const result = createPaginationResponse(0, 1, 10);

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0); // Math.ceil(0/10) = 0
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.hasNextPage).toBe(false); // page (1) < totalPages (0) = false
      expect(result.hasPrevPage).toBe(false);
    });

    it("should handle page exceeding total pages", () => {
      const result = createPaginationResponse(15, 5, 10);

      expect(result.total).toBe(15);
      expect(result.totalPages).toBe(2); // Math.ceil(15/10) = 2
      expect(result.currentPage).toBe(5);
      expect(result.itemsPerPage).toBe(10);
      expect(result.hasNextPage).toBe(false); // page (5) < totalPages (2) = false
      expect(result.hasPrevPage).toBe(true);
    });

    it("should handle negative page number", () => {
      const result = createPaginationResponse(100, -1, 10);

      expect(result.currentPage).toBe(-1);
      expect(result.hasNextPage).toBe(true); // -1 < 10 = true
      expect(result.hasPrevPage).toBe(false); // -1 > 1 = false
    });

    it("should handle edge case: exactly one page", () => {
      const result = createPaginationResponse(10, 1, 10);

      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(false);
    });

    it("should handle edge case: items less than page size", () => {
      const result = createPaginationResponse(3, 1, 10);

      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(1); // Math.ceil(3/10) = 1
      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(false);
    });

    it("should handle edge case: items exactly filling last page", () => {
      const result = createPaginationResponse(30, 3, 10);

      expect(result.total).toBe(30);
      expect(result.totalPages).toBe(3);
      expect(result.currentPage).toBe(3);
      expect(result.itemsPerPage).toBe(10);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(true);
    });

    describe("Edge Cases and Security", () => {
      it("should handle decimal numbers in total", () => {
        const result = createPaginationResponse(99.5, 1, 10);

        expect(result.total).toBe(99.5);
        expect(result.totalPages).toBe(10); // Math.ceil(99.5/10) = 10
      });

      it("should handle decimal page number", () => {
        const result = createPaginationResponse(100, 2.5, 10);

        expect(result.currentPage).toBe(2.5);
        expect(result.totalPages).toBe(10);
        expect(result.hasNextPage).toBe(true); // 2.5 < 10
        expect(result.hasPrevPage).toBe(true); // 2.5 > 1
      });

      it("should handle decimal limit", () => {
        const result = createPaginationResponse(100, 1, 7.5);

        expect(result.itemsPerPage).toBe(7.5);
        expect(result.totalPages).toBe(14); // Math.ceil(100/7.5) = 14
      });
    });
  });
});
