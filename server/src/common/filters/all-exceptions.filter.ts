import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const { method, url } = request;
    const body = request.body ? JSON.stringify(request.body) : '';

    let code = 1;
    let msg = '系统错误';
    
    // Default HTTP status to 200 so frontend always parses the JSON
    // Or we can keep the error status. 
    // Usually with this kind of wrapper { status: { code: ... } }, the HTTP status is 200.
    const httpStatus = HttpStatus.OK; 

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res: any = exception.getResponse();
      
      msg = typeof res === 'string' ? res : (Array.isArray(res.message) ? res.message.join(', ') : res.message);
      // 参数中，ignoreTokenInvalid 为 true 时，不返回 99 错误码
      if (status === HttpStatus.UNAUTHORIZED) {
        const req = ctx.getRequest();
        if (req.body && req.body.ignoreTokenInvalid) {
          code = 97;
          msg = 'token 失效';
        } else {
          code = 99;
          // 保留原始异常消息（如"手机号或密码错误"），不被覆盖
          if (!msg || msg === 'Unauthorized') {
            msg = '登录失效';
          }
        }
      }
    } else if (exception instanceof Error) {
      msg = exception.message;
    }

    this.logger.error(
      `${method} ${url} ${body} → ${msg}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(httpStatus).json({
      status: {
        code: code,
        msg: msg,
      },
      data: [],
      property: {},
    });
  }
}
