import type {
    FastifyJWTSimpleOptions,
    FastifyJWTSimple,
    FastifyJWTSimpleOptionsPostDefaults,
    FastifyJWTSimpleDecorator
} from '@/types.js';
import type { FastifyInstance, FastifyReply } from 'fastify';
import type { FastifyJWTOptions } from '@fastify/jwt';
import fastifyJwt from '@fastify/jwt';
import { FlatCache, FlatCacheEvents } from 'flat-cache';
import fp from 'fastify-plugin';
import authorize from '@/lib/authenticate.js';
import { FST_USER_DATA_NOT_IMPLEMENTED } from '@/lib/errors.js';

import routeToken from '@/routes/token.js';
import routeRefresh from '@/routes/refresh.js';
import routeLogout from '@/routes/logout.js';

import pluginCookie from '@fastify/cookie';

const ONE_SECOND_IN_MS = 1000;
const ONE_MINUTE_IN_MS = 60 * ONE_SECOND_IN_MS;

const addDefaultOptions = (
    options: FastifyJWTSimpleOptions
): FastifyJWTSimpleOptionsPostDefaults => {
    // add default options
    options.path = options.path || { refreshToken: '', token: '', logout: '' };
    options.path.token = options.path.token || '/auth/token';
    options.path.refreshToken = options.path.refreshToken || '/auth/refresh';
    options.path.logout = options.path.logout || '/auth/logout';
    options.expiration = options.expiration || { token: 0, refreshToken: 0 };
    options.expiration.token = options.expiration.token || 60 * 20; // 20 minutes
    options.expiration.refreshToken =
        options.expiration.refreshToken || 60 * 60 * 24 * 7; // 7 days
    options.cookieConfig = options.cookieConfig || { name: 'jwtToken' };
    options.authUser =
        options.authUser ||
        (() => Promise.reject(new FST_USER_DATA_NOT_IMPLEMENTED()));
    options.isRestricted = options.isRestricted || (async () => true);

    return options as FastifyJWTSimpleOptionsPostDefaults;
};

const plugin: FastifyJWTSimple = async (
    app: FastifyInstance,
    options: FastifyJWTSimpleOptions
) => {
    const optionsPostDefaults = addDefaultOptions(options);

    // force add secure cookie to jwt options
    optionsPostDefaults.cookie = {
        cookieName: optionsPostDefaults.cookieConfig.name,
        signed: true
    };

    if (!app.hasPlugin('@fastify/sensible')) {
        app.register(import('@fastify/sensible'));
    }

    if (!app.hasPlugin('@fastify/cookie')) {
        app.register(pluginCookie, {
            secret: optionsPostDefaults.secret.toString()
        }).after(() => {
            app.decorateReply('setSCookie', setSCookie);
        });
    } else {
        app.decorateReply('setSCookie', setSCookie);
    }

    // register  @fastify/jwt plugin
    if (!app.hasPlugin('@fastify/jwt')) {
        app.register(fastifyJwt, options as FastifyJWTOptions);
    } else {
        app.log.error(
            "!!! Don't manually register @fastify/jwt. Disable @fastify/jtw registration and move all options to fastify-jwt-simple !!!"
        );
    }

    // configure cache for banned tokens
    const jwtBannedTokenObj = jwtBannedToken(optionsPostDefaults);
    const jwtBannedRefreshObj = jwtBannedRefresh(optionsPostDefaults);

    jwtBannedTokenObj.load();
    jwtBannedRefreshObj.load();

    jwtBannedTokenObj.on(FlatCacheEvents.ERROR, err => {
        app.log.error(err);
    });
    jwtBannedRefreshObj.on(FlatCacheEvents.ERROR, err => {
        app.log.error(err);
    });

    app.addHook('onClose', async () => {
        // to allow the process to exit
        jwtBannedTokenObj.stopAutoPersist();
        jwtBannedRefreshObj.stopAutoPersist();
    });

    const decorator: FastifyJWTSimpleDecorator = {
        jwtBannedToken: jwtBannedTokenObj,
        jwtBannedRefresh: jwtBannedRefreshObj,
        isRestricted: optionsPostDefaults.isRestricted,
        authUser: optionsPostDefaults.authUser,
        path: optionsPostDefaults.path,
        expiration: optionsPostDefaults.expiration
    };

    app.decorate('fjs', decorator);
    app.addHook('onRequest', authorize);

    // add routes
    app.register(routeToken, {
        prefix: optionsPostDefaults.path.token
    });
    app.register(routeRefresh, {
        prefix: optionsPostDefaults.path.refreshToken
    });
    app.register(routeLogout, {
        prefix: optionsPostDefaults.path.logout
    });
};

const jwtBannedToken = (options: FastifyJWTSimpleOptionsPostDefaults) =>
    new FlatCache({
        cacheId: 'jwt-banned-token',
        ttl: options.expiration.token * ONE_SECOND_IN_MS,
        persistInterval: 5 * ONE_MINUTE_IN_MS, // save to disk every..
        expirationInterval: ONE_MINUTE_IN_MS // checktime for expired keys
    });

const jwtBannedRefresh = (options: FastifyJWTSimpleOptionsPostDefaults) =>
    new FlatCache({
        cacheId: 'jwt-banned-refresh',
        ttl: options.expiration.refreshToken * ONE_SECOND_IN_MS,
        persistInterval: 5 * ONE_MINUTE_IN_MS, // 5 minute
        expirationInterval: 10 * ONE_MINUTE_IN_MS // 10 minute
    });

/**
 * Sets a secure cookie in the response.
 * @param cookieName - The name of the cookie.
 * @param cookieValue - The value of the cookie.
 * @param expires - The expiration date of the cookie.
 * @param path - Optional path for the cookie. Defaults to '/' if not provided.
 * @returns The FastifyReply instance for chaining.
 */
function setSCookie(
    this: FastifyReply,
    cookieName: string,
    cookieValue: string,
    expires: Date,
    path: string = '/'
) {
    const hostname = this.request.hostname;
    return this.setCookie(cookieName, cookieValue, {
        domain: hostname,
        path,
        secure: true, // send cookie over HTTPS only
        httpOnly: true,
        sameSite: true, // alternative CSRF protection
        signed: true,
        expires: expires
    });
}

export default fp(plugin, {
    name: 'fastify-jwt-simple',
    fastify: '5.x'
});

export type { FastifyJWTSimpleOptions };
