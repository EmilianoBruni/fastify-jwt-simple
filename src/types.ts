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
    token: string;
    refreshToken: string;
    logout: string;
};

type Expirations = {
    token: number;
    refreshToken: number;
};

type AuthUserNestedOption<T> = Record<string, string | number | T>;

interface FastifyJWTSimpleInternalOptions {
    cookieConfig: {
        name: string;
        domain?: string;
    };
    path: Paths;
    expiration: Expirations;
    authUser<
        T extends AuthUserNestedOption<T>,
        J extends AuthUserNestedOption<J>
    >(
        request: FastifyRequest<{ Body: J }>
    ): Promise<T>;
    isRestricted(request: FastifyRequest): Promise<boolean>;
}

type FastifyJWTSimpleDecorator = {
    jwtBannedToken: FlatCache;
    jwtBannedRefresh: FlatCache;
} & Omit<FastifyJWTSimpleInternalOptions, 'cookieConfig'>;

type FastifyJWTSimpleOptions = FastifyJWTOptions &
    Partial<FastifyJWTSimpleInternalOptions> & {
        path?: Partial<Paths>;
        expiration?: Partial<Expirations>;
    };

interface FastifyJWTSimpleOptionsPostDefaults
    extends FastifyJWTOptions,
        FastifyJWTSimpleInternalOptions {}

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
