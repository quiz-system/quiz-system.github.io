import { html } from '../lib.js';
import { login, register } from '../api/data.js';

const loginTemplate = (onSubmit) => html`
    <section id="login">
        <div class="pad-large">
            <div class="glass narrow">
                <header class="tab layout">
                    <h1 class="tab-item active">Login</h1>
                    <a class="tab-item" href="/register"> Register </a>
                </header>
                <form @submit=${onSubmit} class="pad-med centered">
                    <label class="block centered"> Username: <input class="auth-input input" type="text" name="username" required /> </label>
                    <label class="block centered"> Password: <input class="auth-input input" type="password" name="password" required /> </label>
                    <input class="block action cta" type="submit" value="Sign In" />
                </form>
                <footer class="tab-footer">
                    Don't have an account?
                    <a class="invert" href="/register"> Create one here </a>
                </footer>
            </div>
        </div>
    </section>
`;

export async function loginPage(ctx) {
    ctx.render(loginTemplate(onSubmit));

    async function onSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username').trim();
        const password = formData.get('password').trim();

        if (username === '' || password === '') {
            return alert('All fields are required!');
        }

        await login(username, password);

        ctx.setUserNav();
        ctx.page.redirect('/browse');
    }
}

const registerTemplate = (onSubmit) => html`
    <section id="register">
        <div class="pad-large">
            <div class="glass narrow">
                <header class="tab layout">
                    <a class="tab-item" href="/login">Login</a>
                    <h1 class="tab-item active">Register</h1>
                </header>
                <form @submit=${onSubmit} class="pad-med centered">
                    <label class="block centered">Username: <input class="auth-input input" type="text" name="username" required /></label>
                    <label class="block centered">Email: <input class="auth-input input" type="text" name="email" required /></label>
                    <label class="block centered">Password: <input class="auth-input input" type="password" name="password" required /></label>
                    <label class="block centered">Repeat Password: <input class="auth-input input" type="password" name="rePass" /></label>
                    <input class="block action cta" type="submit" value="Create Account" />
                </form>
                <footer class="tab-footer">Already have an account? <a class="invert" href="/login">Sign in here</a></footer>
            </div>
        </div>
    </section>
`;

export async function registerPage(ctx) {
    ctx.render(registerTemplate(onSubmit));

    async function onSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get('email').trim();
        const username = formData.get('username').trim();
        const password = formData.get('password').trim();
        const rePass = formData.get('rePass').trim();

        if ([email, username, password].map(Boolean).includes(false)) {
            return alert('All fields are required!');
        }

        if (password !== rePass) {
            return alert("Passwords don't match!");
        }

        await register(email, username, password);

        ctx.setUserNav();
        ctx.page.redirect('/browse');
    }
}
