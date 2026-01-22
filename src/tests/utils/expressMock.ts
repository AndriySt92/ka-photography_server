import { Request, Response } from "express";

import { TestAdmin } from "../fixtures";

type AnyObject = Record<string, unknown>;
type Params = Record<string, string>;
type Query = Record<string, string | string[]>;
type Headers = Record<string, string | string[] | undefined>;

export const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  cookies: {},
  signedCookies: {},
  user: null,
  ...overrides,
});

export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn();
export const createMockNext = () => jest.fn();

export interface ExpressTestSetupOptions {
  reqBody?: AnyObject;
  reqParams?: Params;
  reqQuery?: Query;
  reqUser?: TestAdmin | null;
  reqHeaders?: Headers;
  reqCookies?: Record<string, string>;
  reqFile?: Express.Multer.File;
  reqFiles?: Express.Multer.File[];
  includeNext?: boolean;
  addCookieMethod?: boolean;
  responseMethods?: string[];
}

// convert partial mocks into full Request/Response types
const toRequest = (partialReq: Partial<Request>): Request => partialReq as unknown as Request;
const toResponse = (partialRes: Partial<Response>): Response => partialRes as unknown as Response;

export const setupExpressTest = ({
  reqBody = {},
  reqParams = {},
  reqQuery = {},
  reqUser = null,
  reqHeaders = {},
  reqCookies = {},
  reqFile = undefined,
  reqFiles = undefined,
  includeNext = true,
  responseMethods = [],
  addCookieMethod = true,
}: ExpressTestSetupOptions = {}) => {
  const req = mockRequest({
    body: reqBody,
    params: reqParams,
    query: reqQuery,
    user: reqUser,
    headers: reqHeaders,
    cookies: reqCookies,
    ...(reqFile && { file: reqFile }),
    ...(reqFiles && { files: reqFiles }),
  });

  const res = mockResponse();

  if (addCookieMethod && !("cookie" in res)) {
    (res as Response).cookie = jest.fn().mockReturnValue(res);
    (res as Response).clearCookie = jest.fn().mockReturnValue(res);
  }

  responseMethods.forEach((method) => {
    if (!(method in res)) {
      (res as Record<string, jest.Mock>)[method] = jest.fn().mockReturnValue(res);
    }
  });

  const next = includeNext ? createMockNext() : undefined;

  return {
    req,
    res,
    next,
    toRequest: () => toRequest(req),
    toResponse: () => toResponse(res),
  };
};

export const setupMiddlewareTest = (options: ExpressTestSetupOptions = {}) => {
  const result = setupExpressTest({ ...options, includeNext: true });
  return {
    ...result,
    req: result.toRequest(),
    res: result.toResponse(),
    next: result.next!,
  };
};

export const setupControllerTest = (options: ExpressTestSetupOptions = {}) => {
  const result = setupExpressTest({ ...options, includeNext: false });
  return {
    ...result,
    req: result.toRequest(),
    res: result.toResponse(),
  };
};
