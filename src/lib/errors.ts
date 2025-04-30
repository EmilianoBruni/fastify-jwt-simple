import { createError } from '@fastify/error';

export const FST_INVALID_CREDENTIALS = createError(
    'FST_INVALID_CREDENTIALS',
    'Invalid credentials',
    401
);

export const FST_USER_DATA_NOT_IMPLEMENTED = createError(
    'FST_USER_DATA_NOT_IMPLEMENTED',
    'userData function not implemented',
    501
);

export const FST_JWT_INVALID = createError(
    'FST_JWT_INVALID',
    'Invalid JWT token',
    401
);
export const FST_JWT_TOKEN_BANNED = createError(
    'FST_JWT_TOKEN_BANNED',
    'Token is banned',
    403
);
