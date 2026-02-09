
const url = process.env.SUPABASE_URL + '/auth/v1/health';

console.log(`Checking ${url}...`);

async function check() {
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Body: ${text.substring(0, 500)}`);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

check();
