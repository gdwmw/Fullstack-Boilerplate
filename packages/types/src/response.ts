export interface IMeta {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
}

export interface ISuccessResponse<T> {
  data: null | T;
  message: null | string;
  meta?: IMeta | null;
  success: true;
}

export interface IErrorResponse {
  code?: null | string;
  message: null | string;
  success: false;
}
