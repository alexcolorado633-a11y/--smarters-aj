const ACTIVATION_CODE = '4103';
let deferredPrompt = null;
let currentUser = null;
let channels = [];
let movies = [];
let series = [];

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

document.getElementById('btn-activate').addEventListener('click', () => {
    const input = document.getElementById('activation-code').value;
    const savedCode = localStorage.getItem('activation_code');
    if (savedCode === ACTIVATION_CODE) {
        verificarLoginSalvo();
    } else if (input === ACTIVATION_CODE) {
        localStorage.setItem('activation_code', ACTIVATION_CODE);
        showScreen('login-screen');
    } else {
        alert('Código incorreto!');
    }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab + '-form').classList.add('active');
    });
});

document.getElementById('btn-connect').addEventListener('click', async () => {
    const url = document.getElementById('server-url').value.trim();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!url || !user || !pass) { alert('Preencha todos os campos!'); return; }
    localStorage.setItem('server_url', url);
    localStorage.setItem('xtream_user', user);
    localStorage.setItem('xtream_pass', pass);
    currentUser = { url, user, pass };
    await carregarConteudo();
    showScreen('main-screen');
});

document.getElementById('btn-load-m3u').addEventListener('click', async () => {
    const url = document.getElementById('m3u-url').value.trim();
    const file = document.getElementById('m3u-file').files[0];
    if (url) { await carregarM3U(url); }
    else if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => { await processarM3U(e.target.result); };
        reader.readAsText(file);
    } else { alert('Cole um link ou selecione um arquivo!'); return; }
    showScreen('main-screen');
});

function verificarLoginSalvo() {
    const url = localStorage.getItem('server_url');
    const user = localStorage.getItem('xtream_user');
    const pass = localStorage.getItem('xtream_pass');
    if (url && user && pass) {
        currentUser = { url, user, pass };
        carregarConteudo().then(() => { showScreen('main-screen'); });
    } else { showScreen('login-screen'); }
}

async function carregarConteudo() {
    channels = [
        { id: 1, name: 'TV Globo', logo: '📺', url: '' },
        { id: 2, name: 'SBT', logo: '📡', url: '' },
        { id: 3, name: 'SporTV', logo: '⚽', url: '' },
        { id: 4, name: 'Premiere', logo: '🏆', url: '' },
        { id: 5, name: 'ESPN', logo: '🏅', url: '' },
        { id: 6, name: 'Band', logo: '📺', url: '' },
        { id: 7, name: 'TNT Sports', logo: '🏀', url: '' },
        { id: 8, name: 'CazéTV', logo: '🎥', url: '' },
    ];
    movies = [];
    series = [];
    renderizarCanais();
    carregarJogos();
}

async function carregarM3U(url) {
    try {
        const resposta = await fetch(url);
        const texto = await resposta.text();
        await processarM3U(texto);
    } catch (erro) { alert('Não foi possível carregar a lista. Verifique o link.'); }
}

async function processarM3U(texto) {
    const linhas = texto.split('\n');
    channels = [];
    let nomeCanal = '';
    for (let linha of linhas) {
        if (linha.startsWith('#EXTINF:')) {
            const match = linha.match(/,(.+)$/);
            nomeCanal = match ? match[1].trim() : 'Canal';
        } else if (linha.startsWith('http')) {
            channels.push({
                id: channels.length + 1,
                name: nomeCanal,
                logo: '📺',
                url: linha.trim()
            });
        }
    }
    renderizarCanais();
}

function renderizarCanais(lista = channels) {
    const container = document.getElementById('channels-list');
    container.innerHTML = '';
    lista.forEach(canal => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <div class="channel-thumb">${canal.logo}</div>
            <div class="channel-name">${canal.name}</div>
        `;
        card.addEventListener('click', () => abrirPlayer(canal));
        container.appendChild(card);
    });
}

function abrirPlayer(canal) {
    const modal = document.getElementById('player-modal');
    const video = document.getElementById('video-player');
    document.getElementById('current-title').textContent = canal.name;
    if (canal.url) {
        video.src = canal.url;
        modal.classList.add('active');
        video.play().catch(e => console.log('Reprodução automática bloqueada'));
    } else {
        alert('Link de stream indisponível — use sua lista M3U para ter acesso aos canais');
    }
}

document.getElementById('close-player').addEventListener('click', () => {
    const modal = document.getElementById('player-modal');
    const video = document.getElementById('video-player');
    video.pause();
    video.src = '';
    modal.classList.remove('active');
});

document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.view + '-view').classList.add('active');
        if (btn.dataset.view === 'games') carregarJogos();
    });
});

document.getElementById('channel-search').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrado = channels.filter(c => c.name.toLowerCase().includes(termo));
    renderizarCanais(filtrado);
});

async function carregarJogos() {
    const container = document.getElementById('games-list');
    container.innerHTML = '';
    const jogos = [
        { casa: 'Flamengo', fora: 'Palmeiras', horario: '16:00', status: '🚀 Hoje', canais: ['Globo', 'Premiere'] },
        { casa: 'São Paulo', fora: 'Corinthians', horario: '18:30', status: '⏰ Em breve', canais: ['SporTV'] },
        { casa: 'Grêmio', fora: 'Internacional', horario: '21:00', status: '🏆 Hoje', canais: ['Globo', 'Premiere'] },
    ];
    if (jogos.length === 0) {
        container.innerHTML = '<p class="empty-text">Nenhum jogo encontrado para hoje</p>';
        return;
    }
    jogos.forEach(jogo => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="game-teams">⚽ ${jogo.casa} x ${jogo.fora}</div>
            <div class="game-time">🕐 ${jogo.horario}</div>
            <span class="game-status">${jogo.status}</span>
            <div class="game-channels">📺 Onde assistir: ${jogo.canais.join(', ')}</div>
        `;
        container.appendChild(card);
    });
}

document.getElementById('disconnect-btn').addEventListener('click', () => {
    if (confirm('Deseja desconectar? Os dados salvos serão mantidos.')) {
        showScreen('login-screen');
    }
});

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-pwa').style.display = 'block';
});

document.getElementById('install-pwa').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        document.getElementById('install-pwa').style.display = 'none';
    }
    deferredPrompt = null;
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('PWA registrada ✅'))
            .catch(err => console.log('Erro PWA:', err));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const ativado = localStorage.getItem('activation_code');
    if (ativado === ACTIVATION_CODE) {
        verificarLoginSalvo();
    } else {
        showScreen('activation-screen');
    }
});
