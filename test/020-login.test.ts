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
    t.has(JSON.parse(res.payload), {
        statusCode: 501,
        code: 'FST_USER_DATA_NOT_IMPLEMENTED',
        error: 'Not Implemented',
        message: 'userData function not implemented'
    });

    await app.close();
});

const userBody = 'test';
const passBody = 'test';
const ret = { id: '123' };

const userData = async <T, J>(request: FastifyRequest<{ Body: J }>) => {
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

t.test(
    'Get tokens with defined useData function without autorized',
    async () => {
        const app = Fastify();

        await app.register(plugin, {
            secret: 'mysecret',
            userData
        });
        const res = await app.inject({
            url: app.fjs.pathToken,
            method: 'POST'
        });

        t.equal(res.statusCode, 401, 'status code is 401');
        t.equal(
            res.statusMessage,
            'Unauthorized',
            'status message is Unauthorized'
        );
        t.has(
            JSON.parse(res.payload),
            {
                statusCode: 401,
                code: 'FST_INVALID_CREDENTIALS',
                error: 'Unauthorized',
                message: 'Invalid credentials'
            },
            'payload is correct error message'
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
            userData
        });
        const res = await app.inject({
            url: app.fjs.pathToken,
            method: 'POST',
            payload: { user: userBody, pass: passBody }
        });

        const currentDateMs = Date.now();

        t.equal(res.statusCode, 200, 'status code is 200');
        t.equal(res.statusMessage, 'OK', 'status message is OK');
        // has cookies with name jwtToken and jwtRefreshToken cookies is an array of {name: 'jwtToken', value: 'token'}
        t.equal(res.cookies.length, 2, 'cookies length is 2');
        const jwtToken = res.cookies.find(cookie => cookie.name === 'jwtToken');
        const jwtRefreshToken = res.cookies.find(
            cookie => cookie.name === 'jwtRefreshToken'
        );

        t.ok(jwtToken, 'jwtToken cookie is set');
        t.ok(jwtRefreshToken, 'jwtRefreshToken cookie is set');

        // hash token and refreshToken attributes in payload
        const payload = JSON.parse(res.payload);
        t.hasProps(
            payload,
            ['token', 'refreshToken'],
            'payload has token and refreshToken attributes'
        );

        // payload.token and jwtToken are equal except for the last .characters
        const token = payload.token;
        const jwtTokenParts = jwtToken?.value.split('.').slice(0, 3).join('.');
        t.equal(token, jwtTokenParts, 'token and jwtToken are equal');

        // payload.refreshToken and jwtRefreshToken are equal except for the last .characters
        const refreshToken = payload.refreshToken;
        const jwtRefreshTokenParts = jwtRefreshToken?.value
            .split('.')
            .slice(0, 3)
            .join('.');
        t.equal(
            refreshToken,
            jwtRefreshTokenParts,
            'refreshToken and jwtRefreshToken are equal'
        );

        // decode token and check if the payload is equal to { id: '123' }
        const decodedToken = JSON.parse(
            Buffer.from(token.split('.')[1], 'base64').toString()
        );
        t.equal(decodedToken.id, '123', 'decoded token id is 123');
        // check if the token has not isRefresh property
        t.notOk(decodedToken.isRefresh, 'decoded token isRefresh is false');

        // decode refreshToken and check if the payload is equal to { id: '123' }
        const decodedRefreshToken = JSON.parse(
            Buffer.from(refreshToken.split('.')[1], 'base64').toString()
        );
        t.equal(
            decodedRefreshToken.id,
            ret.id,
            'decoded refreshToken id is 123'
        );
        // check if the refreshToken has isRefresh property and isRefresh is true
        t.equal(
            decodedRefreshToken.isRefresh,
            true,
            'decoded refreshToken isRefresh is true'
        );

        // check if the accessToken and refreshToken have expiration date
        const accessTokenExp = decodedToken.exp;
        const refreshTokenExp = decodedRefreshToken.exp;
        t.ok(accessTokenExp, 'accessToken has expiration date');
        t.ok(refreshTokenExp, 'refreshToken has expiration date');

        // check if the expiration date is a number
        t.equal(typeof accessTokenExp, 'number', 'accessToken exp is a number');
        t.equal(
            typeof refreshTokenExp,
            'number',
            'refreshToken exp is a number'
        );

        // check if expiration date in near current date + app.fjs.accessTokenExp
        const accessTokenExpDate = new Date(accessTokenExp * 1000);
        const refreshTokenExpDate = new Date(refreshTokenExp * 1000);

        const accessTokenExpDiffMs =
            accessTokenExpDate.getTime() - currentDateMs;
        const refreshTokenExpDiffMs =
            refreshTokenExpDate.getTime() - currentDateMs;

        const deltaAccessTokenMs = Math.abs(
            accessTokenExpDiffMs - app.fjs.expiationToken * 1000
        );
        const deltaRefreshTokenMs = Math.abs(
            refreshTokenExpDiffMs - app.fjs.expiationRefreshToken * 1000
        );

        // check if the expiration date is near current date + app.fjs.accessTokenExp
        t.ok(
            deltaAccessTokenMs < 2000,
            'accessToken expiration date is near current date + app.fjs.accessTokenExp'
        );
        t.ok(
            deltaRefreshTokenMs < 2000,
            'refreshToken expiration date is near current date + app.fjs.refreshTokenExp'
        );

        t.same(
            jwtToken?.expires,
            accessTokenExpDate,
            'jwtToken expires is equal to accessToken expiration date'
        );

        t.same(
            jwtRefreshToken?.expires,
            refreshTokenExpDate,
            'jwtRefreshToken expires is equal to refreshToken expiration date'
        );

        await app.close();
    }
);
