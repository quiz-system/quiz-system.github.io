import { html, until } from '../lib.js';
import { categories } from '../util.js';
import { quizTemplate } from './common/quiz-preview.js';
import { getMostRecent, getStats } from '../api/data.js';
import { cubeLoader, lineLoader } from './common/loader.js';

const template = (isLogged) => html`
    <section id="welcome">
        <div class="hero layout">
            <div class="splash right-col"><i class="fas fa-clipboard-list"></i></div>
            <div class="glass welcome">
                <h1>Welcome to Quiz Time!</h1>
                ${until(loadStats(), lineLoader())} ${isLogged ? null : html`<a class="action cta" href="/login">Sign in to create a quiz</a>`}
            </div>
        </div>
        ${until(loadRecent(), cubeLoader())}
    </section>
`;

async function loadStats() {
    const stats = await getStats();

    return html`<p>Home to ${stats} quizzes in ${Object.keys(categories).length} categories. <a href="/browse">Browse all quizzes</a>.</p>`;
}

async function loadRecent() {
    const recent = await getMostRecent();

    return html`
        <div class="pad-large alt-page">
            <h2>Our most recent quiz:</h2>
            ${recent ? quizTemplate(recent) : html` <p>No quizzes yet. Be the first to create one!</p>`}
            <div>
                <a class="action cta" href="/browse">Browse all quizzes</a>
            </div>
        </div>
    `;
}

export default function homePage(ctx) {
    ctx.render(template(sessionStorage.getItem('auth')));
}
