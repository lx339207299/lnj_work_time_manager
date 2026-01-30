export class CustomResponse<T> {
  constructor(
    public status: {
      code: number;
      msg: string;
    },
    public readonly data: T,
    public readonly property: Record<string, any> = {},
    public readonly pagination?: {
        total: number;
        pageSize: number;
        currentPage: number;
    },
  ) {}
  // 成功
  static success<T>(data: T, property?: Record<string, any>, pagination?: {
        total: number;
        pageSize: number;
        currentPage: number;
    }): CustomResponse<T> {
    return new CustomResponse<T>({ code: 0, msg: '成功' }, data, property, pagination);
  }
  // 异常
  static error<T>(code: number, msg: string, property?: Record<string, any>): CustomResponse<T> {
    return new CustomResponse<T>({ code, msg }, [] as unknown as T, property);
  }

}
