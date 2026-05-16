// ==================== SUPABASE CONFIG ====================
const SUPABASE_URL = 'https://hupkzyvbvfpzeihhmgxg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1cGt6eXZidmZwemVpaGhtZ3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjU2NzksImV4cCI6MjA5MjQwMTY3OX0.YevRjHVLFOUFIGcoj0k0dGcFcpUquhW9LTFdsbuRWmE';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== CREDENCIAIS ====================
const INSTRUCTOR_ID = 'trainer';
const INSTRUCTOR_PASSWORD = '123456';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 horas

// ==================== SESSÃO ====================
function verificarSessao(tipoEsperado) {
    const sessionData = localStorage.getItem('aurora_session');
    if (!sessionData) { window.location.href = 'index.html'; return false; }
    try {
        const session = JSON.parse(sessionData);
        if (Date.now() - session.timestamp > SESSION_DURATION) {
            destruirSessao();
            window.location.href = 'index.html';
            return false;
        }
        if (session.tipo !== tipoEsperado) {
            window.location.href = 'index.html';
            return false;
        }
        return session;
    } catch(e) {
        window.location.href = 'index.html';
        return false;
    }
}

function criarSessao(tipo, id, nome) {
    const session = { tipo, id, nome, timestamp: Date.now() };
    localStorage.setItem('aurora_session', JSON.stringify(session));
    localStorage.setItem('aurora_user_id', id);
    localStorage.setItem('aurora_user_nome', nome);
}

function destruirSessao() {
    localStorage.removeItem('aurora_session');
    localStorage.removeItem('aurora_user_id');
    localStorage.removeItem('aurora_user_nome');
}

// ==================== UTILS ====================
const $ = (id) => document.getElementById(id);
const showLoading = () => $('loading').classList.add('show');
const hideLoading = () => $('loading').classList.remove('show');

function toast(msg) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2100);
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function openModal(id) {
    $(id).classList.add('show');
}

function closeModal(id) {
    $(id).classList.remove('show');
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
};

function logout() {
    destruirSessao();
    window.location.href = 'index.html';
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
    document.querySelector('.sidebar-overlay').classList.toggle('show');
}

function closeSidebar() {
    document.querySelector('.sidebar').classList.remove('open');
    document.querySelector('.sidebar-overlay').classList.remove('show');
}

// ==================== KEEP ALIVE ====================
setInterval(() => {
    sb.from('clients').select('id', { count: 'exact', head: true }).then(() => {}).catch(() => {});
}, 240000);

// ==================== BIBLIOTECA DE EXERCÍCIOS ====================
const EXERCISE_LIBRARY = {
    "Peito": ["Supino reto", "Supino inclinado", "Supino declinado", "Crucifixo", "Peck deck", "Cross", "Flexão"],
    "Costas": ["Puxada na frente", "Barra fixa", "Remada curvada", "Remada unilateral", "Levantamento terra"],
    "Ombros": ["Desenvolvimento", "Elevação lateral", "Elevação frontal", "Crucifixo invertido"],
    "Bíceps": ["Rosca direta", "Rosca alternada", "Rosca martelo", "Rosca concentrada"],
    "Tríceps": ["Tríceps corda", "Tríceps testa", "Tríceps francês", "Mergulho"],
    "Quadríceps": ["Agachamento", "Leg press", "Extensora", "Afundo"],
    "Posterior": ["Mesa flexora", "Stiff", "Terra romeno", "Hip thrust"],
    "Panturrilha": ["Panturrilha em pé", "Panturrilha sentado"],
    "Abdômen": ["Abdominal supra", "Abdominal infra", "Prancha"],
    "Cardio": ["Esteira", "Bicicleta", "Elíptico", "Remo"]
};

// ==================== GERAÇÃO DE TREINO ====================
function generateWorkout(gender, goal, level, days) {
    const workouts = { A: [], B: [], C: [], D: [], E: [] };
    let series = "3", reps = "12";
    if (level === "intermediario") { series = "4"; reps = "10"; }
    else if (level === "avancado") { series = "4"; reps = "8"; }
    
    const ex = {
        peito: ["Supino reto", "Supino inclinado", "Crucifixo", "Peck deck", "Flexão"],
        costas: ["Puxada na frente", "Remada curvada", "Remada unilateral", "Barra fixa"],
        ombros: ["Desenvolvimento", "Elevação lateral", "Elevação frontal"],
        biceps: ["Rosca direta", "Rosca alternada", "Rosca martelo"],
        triceps: ["Tríceps corda", "Tríceps testa", "Tríceps francês"],
        quadriceps: ["Agachamento", "Leg press", "Extensora"],
        posterior: ["Mesa flexora", "Stiff", "Terra romeno"],
        gluteos: ["Hip thrust", "Afundo", "Agachamento búlgaro"],
        panturrilha: ["Panturrilha em pé", "Panturrilha sentado"],
        abdomen: ["Abdominal supra", "Prancha", "Abdominal infra"]
    };
    
    if (gender === "male") {
        if (days >= 3) {
            workouts.A = [ex.peito[0], ex.peito[2], ex.ombros[0], ex.ombros[1], ex.triceps[0]].map(n => ({ name: n, series, reps, load: "", notes: "" }));
            workouts.B = [ex.costas[0], ex.costas[1], ex.biceps[0], ex.biceps[1], ex.abdomen[0]].map(n => ({ name: n, series, reps, load: "", notes: "" }));
            workouts.C = [ex.quadriceps[0], ex.quadriceps[1], ex.posterior[0], ex.gluteos[0], ex.panturrilha[0]].map(n => ({ name: n, series, reps, load: "", notes: "" }));
        }
    } else {
        if (days >= 3) {
            workouts.A = [ex.gluteos[0], ex.gluteos[1], ex.quadriceps[0], ex.posterior[0], ex.panturrilha[0]].map(n => ({ name: n, series, reps, load: "", notes: "" }));
            workouts.B = [ex.peito[0], ex.costas[0], ex.ombros[0], ex.biceps[0], ex.triceps[0]].map(n => ({ name: n, series, reps, load: "", notes: "" }));
            workouts.C = [ex.gluteos[0], ex.quadriceps[2], ex.posterior[1], ex.abdomen[0], ex.abdomen[2]].map(n => ({ name: n, series, reps, load: "", notes: "" }));
        }
    }
    return workouts;
}
