import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import { AUDIT_KEY, AuditMetadata } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap((responseBody) => {
        const userId = request.user?.userId;
        const workspaceId =
          request.params?.wid ||
          request.params?.workspaceId ||
          request.params?.id;
        const resourceId =
          responseBody?.data?.id ||
          request.params?.id ||
          request.params?.wid ||
          'unknown';

        if (!workspaceId) return;

        this.auditService.log({
          workspaceId,
          userId,
          moduleId: 'kernel',
          action: metadata.action,
          resourceType: metadata.resourceType,
          resourceId,
          changes: request.body && Object.keys(request.body).length > 0
            ? request.body
            : undefined,
          ipAddress: request.ip,
          userAgent: request.headers?.['user-agent'],
        });
      }),
    );
  }
}
