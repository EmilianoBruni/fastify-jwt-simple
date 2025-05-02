import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'node:crypto';
import type { FastifyJWTSimpleDecorator } from '@/types.js';
import schema from '@/schema/refresh.schema.js';

import {
    FST_JWT_REFRESH_NOT_FOUND,
    FST_JWT_REFRESH_INVALID,
    FST_JWT_NOT_A_REFRESH,
    FST_JWT_REFRESH_BANNED
} from '@/lib/errors.js';

export default async (app: FastifyInstance) => app.get('', { schema }, h);

type FastifyUserDataReturnType = ReturnType<
    FastifyJWTSimpleDecorator['userData']
>;
interface JWTPayloadData extends FastifyUserDataReturnType {
    isRefresh?: boolean;
}

const h = async (req: FastifyRequest, rep: FastifyReply) => {
    // retrieve refreshCookie from request
    const refreshCookieWithMoreUnknownInfo =
        req.headers.authorization || req.cookies.jwtRefreshToken;
    if (!refreshCookieWithMoreUnknownInfo) {
        return new FST_JWT_REFRESH_NOT_FOUND();
    }
    // strip the unknown info which is after last dot if present
    let refreshCookie = refreshCookieWithMoreUnknownInfo
        .split('.')
        .slice(0, 3)
        .join('.');
    // strip bearer if present
    if (refreshCookie.startsWith('Bearer ')) {
        refreshCookie = refreshCookie.slice(7);
    }
    // check if is valid
    const oldToken = req.server.jwt.verify(refreshCookie) as JWTPayloadData;
    if (!oldToken) return new FST_JWT_REFRESH_INVALID();

    // check if is a refresh token
    if (!oldToken.isRefresh) return new FST_JWT_NOT_A_REFRESH();

    // check if is in blacklist
    const sha = createHash('sha256').update(refreshCookie).digest('hex');
    const isBlacklisted = req.server.fjs.jwtBannedRefresh.get(sha);
    if (isBlacklisted) return new FST_JWT_REFRESH_BANNED();

    // generate new access token
    delete oldToken.isRefresh;
    const token = req.server.jwt.sign(oldToken, {
        expiresIn: `${req.server.fjs.expirationToken}s`
    });
    // send new access token

    rep.setSCookie(
        'jwtToken',
        token,
        new Date(Date.now() + req.server.fjs.expirationToken * 1000)
    )
        .code(200)
        .send({ token });
};
