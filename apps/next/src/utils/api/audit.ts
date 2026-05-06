import { getApi, ISuccessResponse } from "./base";

export interface IAuditLogEntry {
  durationMs: number;
  error?: string;
  ip: string;
  level: "ERROR" | "INFO";
  method: string;
  path: string;
  requestId: string;
  statusCode: number;
  ts: string;
  userAgent: string;
}

export interface IAuditLogMeta {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface IAuditLogListResponse {
  data: IAuditLogEntry[];
  meta: IAuditLogMeta;
}

type TQueryParams = {
  dateTime?: string;
  level?: "ERROR" | "INFO";
  limit?: number;
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  page?: number;
  path?: string;
  statusCode?: number;
};

const label = "audit logs";

export const GETAuditLogs = async (params?: TQueryParams): Promise<ISuccessResponse<IAuditLogListResponse>> =>
  getApi<IAuditLogListResponse>({
    endpoint: "/audit",
    label: label,
    params: params,
  });
