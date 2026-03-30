
const axios = require('axios');
const api = axios.create({ baseURL: 'http://localhost:5001' });

async function check() {
    try {
        const res = await api.get('/users/leaderboard');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}
check();
