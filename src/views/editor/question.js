import createAnswerList from './answer.js';
import { html, render } from '../../lib.js';
import { createOverlayLoader } from '../common/loader.js';
import { createQuestion as apiCreateQuestion, updateQuestion } from '../../api/data.js';

const viewTemplate = (question, index, onEdit, onDelete) => html`
    <div class="layout">
        <div class="question-control">
            <button @click=${onEdit} class="input submit action"><i class="fas fa-edit"></i> Edit</button>
            <button @click=${() => onDelete(index)} class="input submit action"><i class="fas fa-trash-alt"></i> Delete</button>
        </div>
        <h3>Question ${index + 1}</h3>
    </div>
    <div>
        <p class="editor-input questions-text">${question.text}</p>

        ${question.answers.map((a, i) => radioView(a, question.correctIndex === i))}
    </div>
`;

const radioView = (value, checked) => html`
    <div class="editor-input">
        <label class="radio">
            <input class="input" type="radio" disabled ?checked=${checked} />
            <i class="fas fa-check-circle"></i>
        </label>
        <span>${value}</span>
    </div>
`;

const editorTemplate = (question, index, onSave, onCancel) => html`
    <div class="layout">
        <div class="question-control">
            <button @click=${onSave} class="input submit action"><i class="fas fa-check-double"></i> Save</button>
            <button @click=${onCancel} class="input submit action"><i class="fas fa-times"></i> Cancel</button>
        </div>
        <h3>Question ${index + 1}</h3>
    </div>

    <form>
        <textarea class="input editor-input editor-text" name="text" placeholder="Enter question" .value=${question.text}></textarea>

        ${createAnswerList(question, index)}
    </form>
`;

export default function createQuestion(quizId, question, removeQuestion, updateCount, edit) {
    let index = 0;
    let editorActive = edit || false;
    let currentQuestion = copyQuestion(question);
    const element = document.createElement('article');
    element.classList.add('editor-question');

    showView();
    return update;

    async function onEdit() {
        editorActive = true;
        showEditor();
    }

    function onCancel() {
        showView();
        element.remove();
        editorActive = false;
        // currentQuestion = copyQuestion(question);        
    }

    function update(newIndex) {
        index = newIndex;
        editorActive ? showEditor() : showView();
        return element;
    }

    async function onSave() {
        const formData = new FormData(element.querySelector('form'));
        const data = [...formData.entries()];

        const answers = data
            .filter(([k, v]) => k.includes('answer-'))
            .reduce((a, [k, v]) => {
                const index = Number(k.split('-')[1]);
                a[index] = v;
                return a;
            }, []);

        if (data.some(([k, v]) => v === '')) {
            return alert("Questions and answers can't be empty!");
        }

        if (data.find(([k, v]) => k.includes('question-')) === undefined) {
            return alert('You need to add answers first!');
        }

        const body = {
            answers,
            text: formData.get('text'),
            correctIndex: Number(data.find(([k, v]) => k.includes('question-'))[1]),
        };

        const loader = createOverlayLoader();

        try {
            element.appendChild(loader);

            if (question.objectId) {
                // update
                await updateQuestion(question.objectId, body);
            } else {
                // create
                const response = await apiCreateQuestion(quizId, body);
                updateCount();
                question.objectId = response.objectId;
            }

            Object.assign(question, body);
            currentQuestion = copyQuestion(question);
            editorActive = false;
            update(index);
        } catch (err) {
            alert(err.message);
            console.error(err);
        } finally {
            loader.remove();
        }

        editorActive = false;
    }

    function showView() {
        const onDelete = async (index) => {
            const loader = createOverlayLoader();
            element.appendChild(loader);
            await removeQuestion(index, question.objectId);
            loader.remove();
        };

        render(viewTemplate(currentQuestion, index, onEdit, onDelete), element);
    }

    function showEditor() {
        render(editorTemplate(currentQuestion, index, onSave, onCancel), element);
    }
}

function copyQuestion(question) {
    const currentQuestion = Object.assign({}, question);
    currentQuestion.answers = currentQuestion.answers.slice();

    return currentQuestion;
}
