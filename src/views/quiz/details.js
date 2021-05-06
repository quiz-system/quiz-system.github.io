import { categories } from '../../util.js';
import { html, until } from '../../lib.js';
import { lineLoader } from '../common/loader.js';
import { getSolutionsCount } from '../../api/data.js';

const detailsTemplate = (quiz, isGuest) => html` <section id="details">
    <div class="pad-large alt-page">
        <article class="details">
            <h1>${quiz.title}</h1>
            <span class="quiz-topic">A quiz by <a href="/users/${quiz.owner.objectId}">${quiz.owner.username}</a> on the topic of ${quiz.category}</span>

            ${until(loadCount(quiz), lineLoader())}
            <p class="quiz-desc">${quiz.description}</p>

            <div>
                ${isGuest
                    ? html`<a class="cta action" href="/quiz/${quiz.objectId}">Begin Quiz</a>`
                    : html`<a class="cta action" href="/login">Sign in to begin the quiz</a>`}
            </div>
        </article>
    </div>
</section>`;

async function loadCount(quiz) {
    const taken = (await getSolutionsCount([quiz.objectId]))[quiz.objectId];

    return html` <div class="quiz-meta">
        <span>${quiz.questionCount} question${quiz.questionCount == 1 ? '' : 's'}</span>
        <span>|</span>
        <span>Taken ${taken} time${taken == 1 ? '' : 's'}</span>
    </div>`;
}

export default async function detailsPage(ctx) {
    const isGuest = sessionStorage.getItem('auth');
    ctx.render(detailsTemplate(ctx.quiz, isGuest));
}
