import { FastifyReply, FastifyInstance } from 'fastify';
import schema from '@/schema/token.schema.js';
import { FastifyJWTSimpleDecorator } from '@/types.js';

import {
    FST_INVALID_CREDENTIALS,
    FST_USER_DATA_NOT_IMPLEMENTED
} from '@/lib/errors.js';

type FastifyRequestWithBody = Parameters<
    FastifyJWTSimpleDecorator['userData']
>[0];
type FastifyUserDataReturnType = ReturnType<
    FastifyJWTSimpleDecorator['userData']
>;

export default async (app: FastifyInstance) => app.post('', { schema }, h);

const h = async (req: FastifyRequestWithBody, rep: FastifyReply) => {
    let userData: Awaited<FastifyUserDataReturnType>;

    try {
        userData = await req.server.fjs.userData(req);
    } catch (error) {
        if (error instanceof FST_USER_DATA_NOT_IMPLEMENTED) {
            return error;
        }

        // TODO: customize with raised error
        return new FST_INVALID_CREDENTIALS();
    }

    if (!userData) {
        return new FST_INVALID_CREDENTIALS();
    }

    const token = req.server.jwt.sign(
        { ...userData },
        { expiresIn: `${req.server.fjs.expiationToken}s` }
    );
    const refreshToken = req.server.jwt.sign(
        { ...userData, isRefresh: true },
        { expiresIn: `${req.server.fjs.expiationRefreshToken}s` }
    );

    // Set cookie for access token
    rep.setSCookie(
        'jwtToken',
        token,
        new Date(Date.now() + req.server.fjs.expiationToken * 1000)
    )
        // Set cookie for refresh token
        .setSCookie(
            'jwtRefreshToken',
            refreshToken,
            new Date(Date.now() + req.server.fjs.expiationRefreshToken * 1000),
            '/auth'
        )
        .code(200)
        .send({ token, refreshToken });
};
