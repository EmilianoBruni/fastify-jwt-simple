import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createHash } from 'node:crypto';
import schema from '@/schema/logout.schema.js';

export default async (app: FastifyInstance) => {
    app.get('', { schema }, h);
};

const h = async (req: FastifyRequest, rep: FastifyReply) => {
    // user here is authenticated because this page is protected

    // add jwt token to the banned list
    const tokenExt =
        (req.headers.authorization as string) ||
        (req.cookies.jwtToken as string);
    let token = tokenExt.split('.').slice(0, 3).join('.');
    // remove Bearer from the token
    if (token.startsWith('Bearer ')) token = token.slice(7);
    const sha = createHash('sha256').update(token).digest('hex');
    req.server.fjs.jwtBannedToken.set(sha, true);
    // add jwt refresh token to the banned list
    if (req.cookies.jwtRefreshToken) {
        const tokenExt = req.cookies.jwtRefreshToken;
        const token = tokenExt.split('.').slice(0, 3).join('.');
        const sha = createHash('sha256').update(token).digest('hex');
        req.server.fjs.jwtBannedRefresh.set(sha, true);
    }

    rep.clearCookie('jwtToken')
        .clearCookie('jwtRefreshToken', {
            path: '/auth/refresh'
        })
        .code(200)
        .send({ message: 'Logged out' });
};
