import type { FastifyJWTOptions } from '@fastify/jwt';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';

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
}

interface FastifyJWTSimpleOptions
    extends FastifyJWTOptions,
        FastifyJWTSimpleInternalOptions {}

interface FastifyJWTSimpleOptionsPostDefaults
    extends FastifyJWTOptions,
        Required<FastifyJWTSimpleInternalOptions> {}

type FastifyJWTSimple = FastifyPluginAsync<FastifyJWTSimpleOptions>;

export type {
    FastifyJWTSimpleOptions,
    FastifyJWTSimple,
    FastifyJWTSimpleOptionsPostDefaults
};
