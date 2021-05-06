import { html, until } from '../lib.js';
import { categories } from '../util.js';
import { getQuizzes } from '../api/data.js';
import { cubeLoader } from './common/loader.js';
import { quizTemplate } from './common/quiz-preview.js';

const template = (ctx, searchParams, title, category) => html`
    <section id="browse">
        <header class="pad-large">
            <form @submit=${(e) => onSearch(e, ctx)} class="browse-filter">
                <input class="input" type="text" name="query" />
                <select class="input" name="topic">
                    <option value="all">All Categories</option>
                    ${populateCategories()}
                </select>
                <button class="input submit action">Search</button>
            </form>
            <h1>All quizzes</h1>
        </header>

        ${until(loadQuizzes(searchParams, title, category), cubeLoader())}
    </section>
`;

export default async function browsePage(ctx) {
    ctx.render(template(ctx, false));
}

async function loadQuizzes(searchParams, title, category) {
    const quizzes = (await getQuizzes()).reverse();

    if (searchParams) {
        const searchResult = searchQuizzes(title, category, quizzes);
        return render(searchResult, true);
    }

    return render(quizzes);
}

function render(quizzes, searchParams) {
    if (quizzes.length) {
        return html`<div class="pad-large alt-page">${quizzes.map(quizTemplate)}</div>`;
    } else if (searchParams) {
        return html`<h1 class="no-quizzes-available">There no results matching your search!</h1>`;
    } else {
        return html`<h1 class="no-quizzes-available">Currently there no quizzes available!</h1>`;
    }
}

function populateCategories() {
    return Object.entries(categories).map(([k, v]) => html`<option value=${k}>${v}</option>`);
}

function onSearch(e, ctx) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('query').trim().toLowerCase();
    const category = formData.get('topic').trim().toLowerCase();

    if (title === '') {
        return alert("Search field can't be empty!");
    }

    ctx.render(template(ctx, true, title, category));
}

function searchQuizzes(title, category, quizzes) {
    return category === 'all'
        ? quizzes.filter((q) => q.title.toLowerCase().includes(title.toLowerCase()))
        : quizzes.filter((q) => q.title.toLowerCase().includes(title.toLowerCase()) && q.category === categories[category]);
}
