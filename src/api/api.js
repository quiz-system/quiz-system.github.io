import { page } from '../lib.js';
import setUserNav from '../app.js';
import { setUserData, clearUserData, getUserData } from '../util.js';

export const settings = { host: '', appId: '', apiKey: '' };

export async function get(url) {
    return await request(url, getOptions());
}

export async function del(url) {
    return await request(url, getOptions('delete'));
}

export async function put(url, data) {
    return await request(url, getOptions('put', data));
}

export async function post(url, data) {
    return await request(url, getOptions('post', data));
}

export async function logout() {
    const response = post(settings.host + '/logout', {});
    clearUserData();
    return response;
}

export async function login(username, password) {
    const response = await post(settings.host + '/login', { username, password });
    setUserData({ username, email: response.email, userId: response.objectId, sessionToken: response.sessionToken });
    return response;
}

export async function register(email, username, password) {
    const response = await post(settings.host + '/users', { email, password, username });
    setUserData({ username, email, userId: response.objectId, sessionToken: response.sessionToken });
    return response;
}

function getOptions(method = 'get', body) {
    const options = {
        method,
        headers: {
            'X-Parse-Application-Id': settings.appId,
            'X-Parse-REST-API-Key': settings.apiKey,
        },
    };

    const auth = getUserData();
    if (auth) {
        options.headers['X-Parse-Session-Token'] = auth.sessionToken;
    }

    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    return options;
}

async function request(url, options) {
    try {
        const response = await fetch(url, options);

        if (response.ok === false) {
            const err = await response.json();
            throw new Error(err.error);
        }

        return await response.json();
    } catch (err) {
        if (err.message === 'Invalid session token' || err.message === 'Session token is expired.') {
            alert("Oops something went wrong, we'll fix it now!");
            page.redirect('/');
            clearUserData();
            setUserNav();
            return;
        }

        alert(err.message);
        throw err;
    }
}
