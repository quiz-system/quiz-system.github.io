const categories = {
    software: 'Software',
    hardware: 'Hardware',
    frameworks: 'Frameworks',
    it: 'Information Technology',
    languages: 'Programming Languages',
};

function getUserData() {
    const auth = sessionStorage.getItem('auth');
    return auth ? JSON.parse(auth) : undefined;
}

function setUserData(auth) {
    sessionStorage.setItem('auth', JSON.stringify(auth));
}

function clearUserData() {
    sessionStorage.removeItem('auth');
}

export { categories, getUserData, setUserData, clearUserData };
