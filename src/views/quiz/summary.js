import { html } from '../../lib.js';

const template = (quiz, result, answers, questions, retakeQuiz, answersReview, showQuestionDetails) => html`
    <section id="summary">
        <div class="hero layout">
            <article class="details glass">
                <h1>Quiz Result</h1>
                <h2>${quiz.title}</h2>

                <div class="${result.percent < 50 ? 'summary summary-top failed' : 'summary summary-top'}">${result.percent}%</div>
                <div class="${result.correct < result.total / 2 ? 'summary failed' : 'summary'}">${result.correct}/${result.total} correct answers</div>

                <a @click=${retakeQuiz} class="action cta" href="javascript:void(0)"><i class="fas fa-sync-alt"></i> Retake Quiz</a>
                <a @click=${answersReview} class="action cta" href="javascript:void(0)"><i class="fas fa-clipboard-list"></i> See Details</a>
            </article>
        </div>
        <div class="pad-large alt-page"></div>
        ${answers ? answers.map((a, i) => answerDetails(a, i, questions, answers, showQuestionDetails)) : null}
    </section>
`;

const answerDetails = (a, i, questions, answers, showQuestionDetails) =>
    answers[i].details
        ? answers[i].details
        : html` <article class="preview">
              <span class=${answers[i].a === questions[i].correctIndex ? 's-correct' : 's-incorrect'}>
                  Question ${i + 1}
                  <i class="fas fa-times"></i>
              </span>
              <div class="right-col">
                  <button @click=${(e) => showQuestionDetails(e, a, i, questions)} class="action">
                      ${answers[i].a === questions[i].correctIndex ? 'See question' : 'Reveal answer'}
                  </button>
              </div>
          </article>`;

const questionDetails = (command, a, i, questions, hideQuestionDetails) =>
    command === 'Reveal answer'
        ? html` 
<article class="preview">
        <span class="s-incorrect">
            Question ${i + 1}
            <i class="fas fa-times"></i>
        </span>
        <div class="right-col">
            <button @click=${() => hideQuestionDetails(i)} class="action">Close</button>
        </div>
        <div>
            <p class="summary-q-text">
               ${questions[i].text}
            </p>

            ${questions[i].answers.map(
                (answer, index) => html`
                    <div class="s-answer">
                        <span class=${index === questions[i].correctIndex ? 's-correct' : 's-incorrect'}>
                            ${answer} 
                            <i class=${index === questions[i].correctIndex ? 'fas fa-check' : 'fas fa-times'}>
                        </span>
                    </div>
                `
            )}
                
    </article>`
        : html`<article class="preview">
        <span class="s-correct">
            Question ${i + 1}
            <i class="fas fa-times"></i>
        </span>
        <div class="right-col">
            <button @click=${() => hideQuestionDetails(i)} class="action">Close</button>
        </div>
        <div>
            <p class="summary-q-text" >
               ${questions[i].text}
            </p>
            
            ${questions[i].answers.map(
                (answer, index) => html`
                    <div class="s-answer">
                        <span class=${index === questions[i].correctIndex ? 's-correct' : 's-incorrect'}>
                            ${answer} 
                            <i class=${index === questions[i].correctIndex ? 'fas fa-check' : 'fas fa-times'}>
                        </span>
                    </div>
                `
            )}
    </article>`;

export default async function summaryPage(ctx) {
    const questions = ctx.quiz.questions;
    const answers = ctx.quiz.answers.map((a) => ({ a }));
    const correct = answers.reduce((acc, { a }, i) => (acc += Number(questions[i].correctIndex === a)), 0);

    update();

    function answersReview(e) {
        update(answers);
        e.target.remove();
    }

    function retakeQuiz() {
        // window.location.reload(true); - forceReload parameter is deprecated, alternative ->
        window.location.href = '/quiz/' + ctx.quiz.objectId; // clearing the cache
    }

    function showQuestionDetails(e, a, i, questions) {
        const details = questionDetails(e.target.textContent.trim(), a, i, questions, hideQuestionDetails);
        answers[i].details = details;
        update(answers);
    }

    function hideQuestionDetails(i) {
        delete answers[i].details;
        update(answers);
    }

    function update(answers) {
        ctx.render(
            template(
                ctx.quiz,
                {
                    correct,
                    total: questions.length,
                    percent: (correct / questions.length) * 100,
                },
                answers,
                questions,
                retakeQuiz,
                answersReview,
                showQuestionDetails
            )
        );
    }
}
