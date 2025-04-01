/**
 * 
 * An array of routes that are accessible to the public 
 * these routes do not require authentication
 * @types {string[]}
 */


export const publicRoutes = [
    "/"
];


/**
 * 
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @types{string[]}
 */
export const authRoutes = [
    "/map",
    "/profile",

    "/auth/login",
    "/auth/register",

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