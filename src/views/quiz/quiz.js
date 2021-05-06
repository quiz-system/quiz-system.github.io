import { cubeLoader } from '../common/loader.js';
import { submitSolution } from '../../api/data.js';
import { html, classMap, styleMap } from '../../lib.js';

const quizTemplate = (quiz, questions, answers, currentIndex, onSelect, onSubmit, resetQuiz) => html`
    <section id="quiz">
        <header class="pad-large">
            <h1>${quiz.title}: Question ${currentIndex + 1} / ${questions.length}</h1>
            <nav class="layout q-control">
                <span class="block">Question index</span>
                ${questions.map((q, i) => indexTemplate(quiz.objectId, i, i === currentIndex, answers[i] !== undefined))}
            </nav>
        </header>
        <div class="pad-large alt-page">
            <article class="question">
                <p class="q-text questions-text">${questions[currentIndex].text}</p>

                <form @change=${onSelect} id="quiz-form">
                    <div>${questions.map((q, i) => questionTemplate(q, i, i === currentIndex))}</div>
                </form>

                <nav class="q-control">
                    <span class="block"> ${answers.filter((a) => a === undefined).length} questions remaining</span>
                    ${currentIndex > 0
                        ? html`
                              <a class="action" href="/quiz/${quiz.objectId}?question=${currentIndex}">
                                  <i class="fas fa-arrow-left"></i>
                                  Previous
                              </a>
                          `
                        : null}
                    <a @click=${resetQuiz} class="action" href="javascript:void(0)"><i class="fas fa-sync-alt"></i> Start over</a>
                    <div class="right-col">
                        ${currentIndex < questions.length - 1
                            ? html`
                                  <a class="action" href="/quiz/${quiz.objectId}?question=${currentIndex + 2}"
                                      >Next
                                      <i class="fas fa-arrow-right"></i>
                                  </a>
                              `
                            : null}
                        ${answers.filter((a) => a === undefined).length === 0 || currentIndex === questions.length - 1
                            ? html`<a @click=${onSubmit} class="action" href="javascript:void(0)">Submit answers</a>`
                            : null}
                    </div>
                </nav>
            </article>
        </div>
    </section>
`;

const indexTemplate = (quizId, i, isCurrent, isAnswered) => {
    const className = {
        'q-index': true,
        'q-current': isCurrent,
        'q-answered': isAnswered,
    };
    return html`<a class=${classMap(className)} href="/quiz/${quizId}?question=${i + 1}"></a>`;
};

const questionTemplate = (question, index, isCurrent) => html`
    <div data-index="question-${index}" style=${styleMap({ display: isCurrent ? '' : 'none' })}>
        ${question.answers.map((a, i) => answerTemplate(index, i, a))}
    </div>
`;

const answerTemplate = (questionIndex, index, value) => html`
    <label class="q-answer radio">
        <input class="input" type="radio" name="question-${questionIndex}" value=${index} />
        <i class="fas fa-check-circle"></i>
        ${value}
    </label>
`;

export default async function quizPage(ctx) {
    const questions = ctx.quiz.questions;
    const index = Number(ctx.querystring.split('=')[1] || 1) - 1;
    const answers = ctx.quiz.answers;

    update();

    function onSelect(e) {
        const questionIndex = Number(e.target.name.split('-')[1]);
        if (questionIndex !== NaN) {
            const answer = Number(e.target.value);
            answers[questionIndex] = answer;
            update();
        }
    }

    async function onSubmit() {
        const result = { correct: 0, total: questions.length };
        const unanswered = answers.filter((a) => a === undefined).length;
        if (unanswered > 0) {
            const confirmed = confirm(`There are ${unanswered} questions without answer, submit anyway?`);
            if (confirmed === false) {
                return;
            }
        }

        for (let i = 0; i < questions.length; i++) {
            if (questions[i].correctIndex === answers[i]) {
                result.correct++;
            }
        }

        ctx.render(cubeLoader());
        await submitSolution(ctx.quiz.objectId, result);
        ctx.page.redirect('/summary/' + ctx.quiz.objectId);
    }

    function resetQuiz() {
        const confirmed = confirm('This will erase your progress! Are you sure you want to start over?');
        if (confirmed) {
            ctx.clearState(ctx.quiz.objectId);
            ctx.page.redirect('/quiz/' + ctx.quiz.objectId);
        }
    }

    function update() {
        return ctx.render(quizTemplate(ctx.quiz, questions, answers, index, onSelect, onSubmit, resetQuiz));
    }
}
