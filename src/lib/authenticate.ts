import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { FastifyJWTSimplePayload } from '../types.js';
import { createHash } from 'node:crypto';
import { FST_JWT_INVALID, FST_JWT_TOKEN_BANNED } from '@/lib/errors.js';

export default async (
    req: FastifyRequest,
    rep: FastifyReply
): Promise<FastifyError | undefined> => {
    // no authentication for login page
    if (req.url === req.server.fjs.path.token) return;
    // no authentication for refresh token page
    if (req.url === req.server.fjs.path.refreshToken) return;

    // if url it's not to authenticate, bypass authentication
    if (!(await req.server.fjs.isRestricted(req))) return;

    try {
        const jwtAuth = await jwtAuthenticate(req);
        if (jwtAuth) {
            return rep.send(jwtAuth);
        }
    } catch (e: unknown) {
        const err = e as FastifyError;
        rep.forbidden(err.toString());
    }

    return;
};

const jwtAuthenticate = async (
    req: FastifyRequest
): Promise<FastifyError | undefined> => {
    const jwt = await req.jwtVerify<FastifyJWTSimplePayload>();
    if (jwt) {
        // check if the token is banned
        // get the jwt token from the request
        const tokenExt =
            (req.headers.authorization as string) ||
            (req.cookies.jwtToken as string); // as because here it can't be undefined
        // cookie has xxx.yyy.zzz.uuu format removed uuu if present
        let token = tokenExt.split('.').slice(0, 3).join('.');
        // remove Bearer from the token
        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        }
        const sha = createHash('sha256').update(token).digest('hex');
        if (!jwtValidate(req, sha)) {
            return new FST_JWT_TOKEN_BANNED();
        }

        // TODO: other checks

        // TODO: add the jwt payload and other data to the request
        return;
    }

    return new FST_JWT_INVALID();
};

export const jwtValidate = (req: FastifyRequest, token: string): boolean => {
    // check if the token is banned
    if (req.server.fjs.jwtBannedToken.get(token)) {
        return false;
    }
    return true;
};
