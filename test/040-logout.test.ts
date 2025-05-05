import { t } from 'tap';
import Fastify from 'fastify';
import type { FastifyRequest } from 'fastify';
import plugin from '@/index.js';

const userBody = 'test';
const passBody = 'test';
const ret = { id: '123' };

const authUser = async <T, J>(request: FastifyRequest<{ Body: J }>) => {
    const { user, pass } = request.body as {
        user: string;
        pass: string;
    };

    if (user === userBody && pass === passBody) {
        return ret as T;
    } else {
        throw new Error('Invalid credentials');
    }
};

const app = Fastify();

t.before(async () => {
    await app.register(plugin, {
        secret: 'mysecret',
        authUser
    });

    // add a route to test
    app.get('/', async () => {
        return { test: true };
    });
});

t.after(async () => {
    await app.close();
});

t.test('Logout without login', async () => {
    const res = await app.inject('/auth/logout');
    t.equal(res.statusCode, 403, 'status code is 403');
    t.equal(res.statusMessage, 'Forbidden', 'status message is Forbidden');
    t.has(JSON.parse(res.payload), {
        statusCode: 403,
        error: 'Forbidden'
    });
});

t.test('Login and logout and try to access end point', async () => {
    const res = await app.inject({
        url: app.fjs.path.token,
        method: 'POST',
        payload: {
            user: userBody,
            pass: passBody
        }
    });

    t.equal(res.statusCode, 200, 'status code is 200');
    const { token } = JSON.parse(res.payload);

    const resLogout = await app.inject({
        url: app.fjs.path.logout,
        method: 'GET',
        headers: {
            authorization: `Bearer ${token}`
        }
    });

    t.equal(resLogout.statusCode, 200, 'status code is 200');
    t.equal(resLogout.statusMessage, 'OK', 'status message is OK');
    t.has(JSON.parse(resLogout.payload), {
        message: 'Logged out'
    });

    // try to access the end point with the token
    const resAccess = await app.inject({
        url: '/',
        method: 'GET',
        headers: {
            authorization: `Bearer ${token}`
        }
    });

    t.equal(resAccess.statusCode, 403, 'status code is 403');
    t.equal(
        resAccess.statusMessage,
        'Forbidden',
        'status message is Forbidden'
    );
    t.has(JSON.parse(resAccess.payload), {
        statusCode: 403,
        error: 'Forbidden',
        code: 'FST_JWT_TOKEN_BANNED'
    });
});

t.end();
