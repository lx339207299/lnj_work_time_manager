import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

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
      
      if (status === HttpStatus.UNAUTHORIZED) {
        code = 99;
        msg = '登录失效';
      }
    } else if (exception instanceof Error) {
      msg = exception.message;
    }

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
