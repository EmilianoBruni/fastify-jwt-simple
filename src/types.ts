import type { FastifyJWTOptions } from '@fastify/jwt';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { FlatCache } from 'flat-cache';

declare module 'fastify' {
    interface FastifyInstance {
        fjs: FastifyJWTSimpleDecorator;
    }
    interface FastifyReply {
        setSCookie(
            cookieName: string,
            cookieValue: string,
            expires: Date,
            path?: string
        ): FastifyReply;
    }
}

interface FastifyJWTSimpleInternalOptions {
    cookieConfig?: {
        name: string;
        domain?: string;
    };
    pathToken?: string;
    pathRefreshToken?: string;
    pathLogout?: string;
    expiationToken?: number;
    expiationRefreshToken?: number;
    userData?<T>(request?: FastifyRequest): Promise<T>;
    isToAuthenticate?(request?: FastifyRequest): Promise<boolean>;
}

interface FastifyJWTSimpleDecorator {
    jwtBannedToken: FlatCache;
    jwtBannedRefresh: FlatCache;
    userData<T>(request?: FastifyRequest): Promise<T>;
    isToAuthenticate(request?: FastifyRequest): Promise<boolean>;
}

interface FastifyJWTSimpleOptions
    extends FastifyJWTOptions,
        FastifyJWTSimpleInternalOptions {}

interface FastifyJWTSimpleOptionsPostDefaults
    extends FastifyJWTOptions,
        Required<FastifyJWTSimpleInternalOptions> {}

type FastifyJWTSimple = FastifyPluginAsync<FastifyJWTSimpleOptions>;

interface FastifyJWTSimplePayload {
    isRefresh?: boolean;
}

export type {
    FastifyJWTSimpleOptions,
    FastifyJWTSimple,
    FastifyJWTSimpleOptionsPostDefaults,
    FastifyJWTSimpleDecorator,
    FastifyJWTSimplePayload
};
