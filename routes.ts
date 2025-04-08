/**
 * 
 * An array of routes that are accessible to the public 
 * these routes do not require authentication
 * @types {string[]}
 */


export const publicRoutes = [
    "/",
    "/auth/new-verification"
];


/**
 * 
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @types{string[]}
 */
export const authRoutes = [

    "/auth/login",
    "/auth/register",
    "/auth/error",
    "/auth/reset",
    "/auth/new-password"

];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix used for API
 * authentication purposes
 * 
 */


export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * @types {string}
 * 
 */

export const DEFAULT_LOGIN_REDIRECT = "/settings";