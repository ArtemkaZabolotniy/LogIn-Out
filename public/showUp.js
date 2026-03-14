window.onload = () => {
    const stored = localStorage.getItem('logInData');
    if (stored) {
        try {
            const [user, password] = JSON.parse(stored);
            document.getElementById('usernameInfo').textContent = user;
            document.getElementById('passwordInfo').textContent = password;
        } catch (e) {
            console.error('failed to parse stored login data', e);
        }
    } else {
        alert('no login data yet, try later');
    }
}