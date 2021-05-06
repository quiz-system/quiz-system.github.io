import createList from './list.js';
import { categories } from '../../util.js';
import { html, render } from '../../lib.js';
import { overlayLoader } from '../common/loader.js';
import { createQuiz, updateQuiz, getQuizByQuizId, getQuestionsByQuizId } from '../../api/data.js';

const template = (quiz, quizEditor, updateCount) => html`
    <section id="editor">
        <header class="pad-large">
            <h1>${quiz ? 'Edit Quiz' : 'New Quiz'}</h1>
        </header>

        ${quizEditor} ${quiz ? createList(quiz.objectId, quiz.questions, updateCount) : null}
    </section>
`;

const quizEditorTemplate = (onSave, quiz, loading) => html`
    <form @submit=${onSave}>
        <label class="editor-label layout">
            <span class="label-col">Quiz Title:</span>
            <input class="input i-med" type="text" name="title" .value=${quiz ? quiz.title : null} ?disabled=${loading} />
        </label>

        <label class="editor-label layout">
            <span class="label-col">Category:</span>
            <select class="input i-med" name="category" .value=${quiz ? quiz.category : '0'} ?disabled=${loading}>
                <option value="0"><span class="quiz-meta">-- Select Category</span></option>
                ${Object.entries(categories).map(([k, v]) => html`<option value=${k} ?selected=${quiz && quiz.category === v}>${v}</option>`)}
            </select>
        </label>

        <label class="editor-label layout">
            <span class="label-col">Description</span>
            <textarea class="input i-med" name="description" .value=${quiz ? quiz.description : null} ?disabled=${loading}></textarea>
        </label>

        <input class="input submit action" type="submit" value="Save" />
    </form>

    ${loading ? overlayLoader : null}
`;

function createQuizEditor(onSave, quiz) {
    const editor = document.createElement('div');
    editor.classList.add('pad-large', 'alt-page');
    update();

    return {
        editor,
        updateEditor: update,
    };

    function update(loading) {
        render(quizEditorTemplate(onSave, quiz, loading), editor);
    }
}

export default async function editorPage(ctx) {
    const quizId = ctx.params.id;
    const ownerId = JSON.parse(sessionStorage.getItem('auth')).userId || undefined;
    const [quiz, questions] = quizId ? await Promise.all([getQuizByQuizId(quizId), getQuestionsByQuizId(quizId, ownerId)]) : [null, []];

    if (quizId) {
        quiz.questions = questions;
    }

    const { editor, updateEditor } = createQuizEditor(onSave, quiz);
    ctx.render(template(quiz, editor, updateCount));

    async function updateCount(change = 0) {
        const count = questions.length + change;
        await updateQuiz(quizId, { questionCount: count });
    }

    async function onSave(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const [title, description, category] = [
            formData.get('title').trim(),
            formData.get('description').trim(),
            categories[formData.get('category').trim()],
        ];

        if ([title, description, category].map(Boolean).includes(false)) {
            return alert('All fields are required!');
        }

        const data = { title, category, description, questionCount: questions.length };

        try {
            updateEditor(true);

            if (quizId) {
                await updateQuiz(quizId, data);
            } else {
                const response = await createQuiz(data);
                ctx.page.redirect('/edit/' + response.objectId);
            }
        } catch (err) {
            alert(err);
        } finally {
            updateEditor(false);
        }
    }
}
