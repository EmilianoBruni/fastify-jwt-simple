import { t } from 'tap';
import Fastify, { FastifyRequest } from 'fastify';
import plugin from '@/index.js';

t.test('Get tokens without defined useData function', async t => {
    const app = Fastify();

    await app.register(plugin, {
        secret: 'mysecret'
    });
    const res = await app.inject({ url: app.fjs.pathToken, method: 'POST' });
    t.equal(res.statusCode, 501);
    t.equal(res.statusMessage, 'Not Implemented');
    t.equal(
        res.payload,
        '{"statusCode":501,"code":"FST_USER_DATA_NOT_IMPLEMENTED","error":"Not Implemented","message":"userData function not implemented"}'
    );

    await app.close();
});

t.test(
    'Get tokens with defined useData function without autorized',
    async () => {
        const app = Fastify();

        await app.register(plugin, {
            secret: 'mysecret',
            userData: async <T, J>(request: FastifyRequest<{ Body: J }>) => {
                const { user, pass } = request.body as {
                    user: string;
                    pass: string;
                };
                if (user === 'test' && pass === 'test') {
                    return { id: '123' } as T;
                } else {
                    throw new Error('Invalid credentials');
                }
            }
        });
        const res = await app.inject({
            url: app.fjs.pathToken,
            method: 'POST'
        });

        t.equal(res.statusCode, 401);
        t.equal(res.statusMessage, 'Unauthorized');
        t.equal(
            res.payload,
            '{"statusCode":401,"code":"FST_INVALID_CREDENTIALS","error":"Unauthorized","message":"Invalid credentials"}'
        );

        await app.close();
    }
);

t.test(
    'Get tokens with defined useData function without autorized',
    async () => {
        const app = Fastify();

        await app.register(plugin, {
            secret: 'mysecret',
            userData: async <T, J>(request: FastifyRequest<{ Body: J }>) => {
                const { user, pass } = request.body as {
                    user: string;
                    pass: string;
                };
                if (user === 'test' && pass === 'test') {
                    return { id: '123' } as T;
                } else {
                    throw new Error('Invalid credentials');
                }
            }
        });
        const res = await app.inject({
            url: app.fjs.pathToken,
            method: 'POST',
            payload: { user: 'test', pass: 'test' }
        });

        t.equal(res.statusCode, 200);
        t.equal(res.statusMessage, 'OK');
        // hash token and refreshToken attributes in payload
        const payload = JSON.parse(res.payload);
        t.hasProps(
            payload,
            ['token', 'refreshToken'],
            'payload has token and refreshToken attributes'
        );

        await app.close();
    }
);
