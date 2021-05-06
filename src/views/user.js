import { html, until } from '../lib.js';
import { getUserData } from '../util.js';
import { cubeLoader } from './common/loader.js';
import { getUserData as getUserDataAPI, deleteQuiz } from '../api/data.js';
import { getSolutionsByUserId, getQuizzesByUserId, getQuizByQuizId, getSolutionsCount } from '../api/data.js';

const template = (update) => html`${until(update(), cubeLoader())}`;

const quizTemplate = ({ title, category, questionCount, objectId }, quizTakenTimes, isProfileOwner, onDelete) => html`
    <article class="preview layout">
        <div class="right-col">
            <a class="action cta" href=${'/details/' + objectId}>View Quiz</a>

            ${isProfileOwner
                ? html`
                      <a class="action cta" href=${'/edit/' + objectId}><i class="fas fa-edit"></i></a>
                      <a @click=${() => onDelete(objectId)} class="action cta" href="javascript:void(0)"><i class="fas fa-trash-alt"></i></a>
                  `
                : null}
        </div>
        <div class="left-col">
            <h3><a class="quiz-title-link" href=${'/details/' + objectId}>${title}</a></h3>
            <br />
            <span class="quiz-topic">Category: ${category}</span>
            <div class="quiz-meta">
                <span>${questionCount} questions${questionCount === 1 ? '' : 's'}</span>
                <span>|</span>
                <span>Taken ${quizTakenTimes[objectId]} time${quizTakenTimes[objectId] == 1 ? '' : 's'}</span>
            </div>
        </div>
    </article>
`;

export default async function userPage(ctx) {
    const quizTakenTimes = {};
    const user = getUserData();
    const viewedProfileId = ctx.params.id;
    const isProfileOwner = user && user.userId === viewedProfileId;
    const data = { userLastSolution: null, quizzesCreatedByUser: null, userLastCompleteQuiz: null };
    const [quizzesCreatedByUserData, userLastSolutionData] = await Promise.all([
        getQuizzesByUserId(viewedProfileId),
        getSolutionsByUserId(viewedProfileId),
    ]);

    if (userLastSolutionData.length) {
        const userLastSolution = userLastSolutionData.slice(-1).shift();
        data.userLastCompleteQuiz = await getQuizByQuizId(userLastSolution.quiz.objectId);
        data.userLastSolution = userLastSolution;
        const date = new Date(userLastSolution.createdAt);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        data.userLastSolution.date = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    if (quizzesCreatedByUserData.length) {
        data.quizzesCreatedByUser = quizzesCreatedByUserData.reverse();
        Object.assign(quizTakenTimes, await getSolutionsCount(data.quizzesCreatedByUser.map((q) => q.objectId)));
    }

    async function update() {
        // the function 'update' needs to work with promises in order for the loader to be visualized
        const { username } = await getUserDataAPI(viewedProfileId);

        return html`
            <section id="profile">
                <div class="hero pad-large">
                    <article class="glass pad-large profile">
                        <h2>${isProfileOwner ? 'Your' : 'User'} Details</h2>
                        <p>
                            <span class="profile-info">Username:</span>
                            ${username}
                        </p>
                        ${isProfileOwner
                            ? html`
                                  <p>
                                      <span class="profile-info">Email:</span>
                                      ${user.email}
                                  </p>
                              `
                            : null}
                        <h2>${isProfileOwner ? 'Your Last Quiz Result' : `${username}'s Last Quiz Result`}</h2>
                        <table class="quiz-results">
                            <tbody>
                                ${data.userLastSolution
                                    ? html` <tr class="results-row">
                                          <td class="cell-1">${data.userLastSolution.date}</td>
                                          <td class="cell-2">
                                              <a href=${'/details/' + data.userLastCompleteQuiz.objectId}>${data.userLastCompleteQuiz.title}</a>
                                          </td>
                                          <td
                                              class="${(data.userLastSolution.correct / data.userLastSolution.total) * 100 < 50
                                                  ? 'cell-3 s- failed'
                                                  : 'cell-3 s-correct'}"
                                          >
                                              ${(data.userLastSolution.correct / data.userLastSolution.total) * 100}%
                                          </td>
                                          <td
                                              class="${data.userLastSolution.total / 2 > data.userLastSolution.correct
                                                  ? 'cell-3 s- failed'
                                                  : 'cell-3 s-correct'}"
                                          >
                                              ${data.userLastSolution.correct}/${data.userLastSolution.total} correct answers
                                          </td>
                                      </tr>`
                                    : html`
                                          <h4>${isProfileOwner ? 'You' : username} haven't completed any quizzes yet.</h4>
                                          <br />
                                          ${isProfileOwner ? html`<a href="/browse">Browse all quizzes</a>` : null}
                                      `}
                            </tbody>
                        </table>
                    </article>
                </div>
                <header class="pad-large">
                    <h2>Quizzes created by ${isProfileOwner ? 'you' : username}</h2>
                </header>
                <div class="pad-large alt-page">
                    ${data.quizzesCreatedByUser
                        ? data.quizzesCreatedByUser.map((q) => quizTemplate(q, quizTakenTimes, isProfileOwner, onDelete))
                        : html`
                              <h2>${isProfileOwner ? 'You' : username} haven't created any quizzes yet.</h2>
                              <br />
                              ${isProfileOwner ? html`<a href="/create">Create one now</a>` : null}
                          `}
                </div>
            </section>
        `;
    }

    async function onDelete(id) {
        const confirmed = confirm('Are you sure you want to delete this quiz?');
        if (confirmed) {
            await deleteQuiz(id, user.userId);
            ctx.page.redirect('/users/' + user.userId);
        }
    }

    ctx.render(template(update));
}
