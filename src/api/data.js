import * as api from './api.js';

const host = 'https://parseapi.back4app.com';

api.settings.host = host;
api.settings.appId = 'vEfftZE09rEmQCcu0aqRlQnjmCU5l68m48UEGB1O';
api.settings.apiKey = '63fBcl2FphOrfKG58Haxc8piu7owwpg4u84ntIx0';

export const login = api.login;
export const logout = api.logout;
export const register = api.register;

// Implement application specific requests
function createPointer(name, id) {
    return { __type: 'Pointer', className: name, objectId: id };
}

function addOwner(object) {
    const userId = JSON.parse(sessionStorage.getItem('auth')).userId;
    const result = Object.assign({}, object);
    result.owner = createPointer('_User', userId);
    return result;
}

export async function getUserData(id) {
    return await api.get(host + '/users/' + id);
}

// Quiz collection
export async function deleteQuiz(id, userId) {
    (await Promise.all(await getQuestionsByQuizId(id, userId))).forEach((q) => deleteQuestion(q.objectId));
    return await api.del(host + '/classes/Quiz/' + id);
}

export async function createQuiz(quiz) {
    const body = addOwner(quiz);
    return await api.post(host + '/classes/Quiz', body);
}

export async function updateQuiz(id, quiz) {
    return await api.put(host + '/classes/Quiz/' + id, quiz);
}

export async function getQuizzes() {
    const quizzes = (await api.get(host + '/classes/Quiz')).results; // empty array if none
    const timesTaken = quizzes.length ? await getSolutionsCount(quizzes.map((q) => q.objectId)) : null;
    quizzes.forEach((q) => (q.taken = timesTaken[q.objectId]));
    return quizzes.length ? quizzes : null;
}

export async function getQuizByQuizId(id) {
    return await api.get(host + '/classes/Quiz/' + id + '?include=owner');
}

export async function getQuizzesByUserId(userId) {
    const query = JSON.stringify({ owner: createPointer('_User', userId) });
    const response = await api.get(host + '/classes/Quiz?where=' + encodeURIComponent(query));
    return response.results;
}

export async function getMostRecent() {
    const quiz = (await api.get(host + '/classes/Quiz?order=-createdAt&limit=1')).results[0];
    if (quiz) {
        const taken = await getSolutionsCount([quiz.objectId]);
        quiz.taken = taken[quiz.objectId];
    }
    return quiz;
}

export async function getStats() {
    return (await api.get(host + '/classes/Quiz?count=1&limit=0')).count;
}

// Question collection
export async function createQuestion(quizId, question) {
    const body = addOwner(question);
    body.quiz = createPointer('Quiz', quizId);
    return await api.post(host + '/classes/Question', body);
}

export async function deleteQuestion(id) {
    return await api.del(host + '/classes/Question/' + id);
}

export async function updateQuestion(id, question) {
    return await api.put(host + '/classes/Question/' + id, question);
}

export async function getQuestionsByQuizId(quizId, ownerId) {
    const query = JSON.stringify({
        quiz: createPointer('Quiz', quizId),
        owner: createPointer('_User', ownerId),
    });
    const response = await api.get(host + '/classes/Question?where=' + encodeURIComponent(query));
    return response.results;
}

// Solution collection
export async function getSolutionsByUserId(userId) {
    const query = JSON.stringify({ owner: createPointer('_User', userId) });
    const response = await api.get(host + '/classes/Solution?where=' + encodeURIComponent(query));
    return response.results;
}

export async function getSolutionsByQuizId(quizId) {
    const query = JSON.stringify({ owner: createPointer('Quiz', quizId) });
    const response = await api.get(host + '/classes/Solution?where=' + encodeURIComponent(query));
    return response.results;
}

export async function submitSolution(quizId, solution) {
    const body = addOwner(solution);
    body.quiz = createPointer('Quiz', quizId);
    return await api.post(host + '/classes/Solution', body);
}

export async function getSolutionsCount(quizIds) {
    const query = JSON.stringify({ $or: quizIds.map((id) => ({ quiz: createPointer('Quiz', id) })) });
    const solutions = (await api.get(host + '/classes/Solution?where=' + encodeURIComponent(query))).results; // empty array if none

    if (solutions.length === 0) {
        return quizIds.reduce((a, c) => {
            if (!a[c]) {
                a[c] = 0;
            }
            return a;
        }, {});
    }
    return solutions.reduce((a, c) => {
        const id = c.quiz.objectId;
        if (!a[id]) {
            a[id] = 0;
        }
        a[id]++;
        return a;
    }, {});
}
