// define a ajv schema for token post request

import { Type } from '@sinclair/typebox';
import { FastifyJWTSimpleDecorator } from '@/types.js';
import { FastifyRequest } from 'fastify';

// import tsj from 'ts-json-schema-generator';

// Extract the Body type from FastifyRequest
type ExtractBody<T> = T extends FastifyRequest<{ Body: infer J }> ? J : never;

// Example usage
export type UserDataBody = ExtractBody<
    Parameters<FastifyJWTSimpleDecorator['userData']>[0]
>;

export default {
    tags: ['auth'],
    response: {
        200: Type.Object({
            token: Type.String(),
            refreshToken: Type.String()
        }),
        401: Type.Object({
            error: Type.String()
        })
    }
};
