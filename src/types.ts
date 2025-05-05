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

type Paths = {
    token?: string;
    refreshToken?: string;
    logout?: string;
};

type Expirations = {
    token?: number;
    refreshToken?: number;
};

interface FastifyJWTSimpleInternalOptions {
    cookieConfig?: {
        name: string;
        domain?: string;
    };
    path?: Paths;
    expiration?: Expirations;
    authUser?<
        T extends Record<string, string | number | T>,
        J extends Record<string, string | number | J>
    >(
        request: FastifyRequest<{ Body: J }>
    ): Promise<T>;
    isRestricted?(request: FastifyRequest): Promise<boolean>;
}

interface FastifyJWTSimpleDecorator {
    jwtBannedToken: FlatCache;
    jwtBannedRefresh: FlatCache;
    isRestricted(request: FastifyRequest): Promise<boolean>;
    path: Required<Paths>;
    expiration: Required<Expirations>;
    authUser<
        T extends Record<string, string | number | T>,
        J extends Record<string, string | number | J>
    >(
        request: FastifyRequest<{ Body: J }>
    ): Promise<T>;
}

interface FastifyJWTSimpleOptions
    extends FastifyJWTOptions,
        FastifyJWTSimpleInternalOptions {}

interface FastifyJWTSimpleOptionsPostDefaults
    extends FastifyJWTOptions,
        Required<FastifyJWTSimpleInternalOptions> {
    path: Required<Paths>;
    expiration: Required<Expirations>;
}

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
