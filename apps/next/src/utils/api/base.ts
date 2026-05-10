import { logTemplate } from "@repo/utils";
import axios, { AxiosRequestHeaders, AxiosResponse, Method } from "axios";

import { clientEnv } from "@/src/environments";
import { getSession } from "@/src/utils";

const API_URL = clientEnv.NEXT_PUBLIC_BASE_API_URL;

export interface ISuccessResponse<T> {
  data: T;
  message: string;
  meta?: { page: number; pageSize: number; total: number; totalPages?: number } | null;
  success: true;
}

export interface IErrorResponse {
  code: null | string;
  message: null | string;
  success: false;
}

interface I {
  auth?: boolean;
  data?: unknown;
  endpoint: string;
  headers?: AxiosRequestHeaders;
  label: string;
  method?: Method;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
}

export const apiRequest = async <T>({ auth = true, ...props }: I): Promise<ISuccessResponse<T>> => {
  const accessToken = auth ? await getSession("accessToken") : null;

  try {
    const res: AxiosResponse<ISuccessResponse<T>> = await axios({
      data: props.data,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken as string}` }),
        ...props.headers,
      },
      method: props.method,
      params: props.params,
      url: `${API_URL}${props.endpoint}`,
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    let statusCode: number | undefined;
    let errorMessage = "an unknown error occurred";

    if (axios.isAxiosError<IErrorResponse>(error)) {
      if (process.env.NODE_ENV === "development" || clientEnv.NEXT_PUBLIC_DEBUG_MODE) {
        console.error(error.response);
      }
      statusCode = error.response?.status;
      errorMessage = error.response?.data?.message ?? error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    logTemplate.ERROR(
      `an error occurred while processing ${props.method} request for ${props.label} || status Code: ${statusCode} || message: ${errorMessage}`,
      "api request",
    );

    throw error;
  }
};

export const getApi = <T>(props: Omit<I, "data" | "method">): Promise<ISuccessResponse<T>> => apiRequest<T>({ ...props, method: "GET" });

export const postApi = <T>(props: Omit<I, "method" | "params">): Promise<ISuccessResponse<T>> => apiRequest<T>({ ...props, method: "POST" });

export const putApi = <T>(props: Omit<I, "method" | "params">): Promise<ISuccessResponse<T>> => apiRequest<T>({ ...props, method: "PUT" });

export const patchApi = <T>(props: Omit<I, "method" | "params">): Promise<ISuccessResponse<T>> => apiRequest<T>({ ...props, method: "PATCH" });

export const deleteApi = <T>(props: Omit<I, "data" | "method" | "params">): Promise<ISuccessResponse<T>> =>
  apiRequest<T>({ ...props, method: "DELETE" });
