// --- GESTIÓN DE COOKIES Y DETECCIÓN DE URL ---
document.addEventListener("DOMContentLoaded", () => {
    // Tu lógica original de cookies
    if (!localStorage.getItem("cookiesAccepted")) {
        document.getElementById("cookieBanner").style.display = "flex";
    }

    // [CORRECCIÓN 1] Detectar si el usuario viene de escanear el QR (?verify=NOVA-XXXXX)
    const urlParams = new URLSearchParams(window.location.search);
    const starIdFromQR = urlParams.get('verify');
    if (starIdFromQR) {
        document.getElementById('myStarInput').value = starIdFromQR;
        loadMyStar(); // Carga automática del certificado
    }
});

function acceptCookies() {
    localStorage.setItem("cookiesAccepted", "true");
    document.getElementById("cookieBanner").style.display = "none";
}

const legalTexts = {
    'Aviso Legal': `
        <strong style="color: var(--gold-main);">1. Datos Identificativos</strong><br>
        En cumplimiento del artículo 10 de la Ley 34/2002...<br><br>
        <strong style="color: var(--gold-main);">2. Naturaleza del Servicio</strong><br>
        NovaRegistry ofrece un servicio de archivo astrométrico de carácter conmemorativo...
    `,
    'Política de Privacidad': `
        <strong style="color: var(--gold-main);">1. Responsable del Tratamiento</strong><br>
        En cumplimiento con el Reglamento (UE) 2016/679 (RGPD)...
    `,
    'Términos y Condiciones': `
        <strong style="color: var(--gold-main);">1. Objeto y Desistimiento</strong><br>
        De acuerdo con el artículo 103 de la Ley General... No se admiten devoluciones.
    `
};

function openLegalModal(type) {
    document.getElementById('legalTitle').innerText = type;
    document.getElementById('legalContent').innerHTML = legalTexts[type];
    document.getElementById('legalModal').style.display = 'flex';
}

// --- FIREBASE INICIALIZACIÓN ---
const firebaseConfig = {
    apiKey: "AIzaSyD5F10FeOf1cAO_6j3v_OR8WHIxw-lQo6w",
    authDomain: "novagetristy.firebaseapp.com",
    projectId: "novagetristy",
    storageBucket: "novagetristy.firebasestorage.app",
    messagingSenderId: "428175556961",
    appId: "1:428175556961:web:2f227bdd521a8994b34520"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let isAdminActive = false;
let adminClickCount = 0;
let lastClickTime = 0;

function handleLogoClick() {
    showSection('home');
    let currentTime = new Date().getTime();
    if (currentTime - lastClickTime > 1500) { adminClickCount = 0; }
    adminClickCount++;
    lastClickTime = currentTime;

    if (adminClickCount === 5) {
        adminClickCount = 0;
        let adminModalHtml = `
            <div id="adminLogin" style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#111; padding:20px; border:1px solid gold; z-index:9999;">
                <input type="email" id="admE" placeholder="Admin Email"><br><br>
                <input type="password" id="admP" placeholder="Password"><br><br>
                <button onclick="loginAdmin()">Entrar</button> <button onclick="document.getElementById('adminLogin').remove()">X</button>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', adminModalHtml);
    }
}

function loginAdmin() {
    let e = document.getElementById('admE').value;
    let p = document.getElementById('admP').value;
    auth.signInWithEmailAndPassword(e, p).then(() => {
        isAdminActive = true;
        alert("🚀 MODO ADMIN ACTIVADO.");
        document.getElementById('nav-admin').style.display = 'inline-block';
        document.getElementById('adminLogin').remove();
        loadAdminDashboard();
    }).catch(() => alert("Acceso denegado."));
}

// --- GENERADOR DE PDF (CON CLONADO) ---
async function downloadPDF() {
    const originalElement = document.getElementById('pdf-content');
    const btn = document.getElementById('downloadPdfBtn');
    const starCode = document.getElementById('certId').innerText || "Documento";
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-sync fa-spin"></i> Renderizando...';
    btn.style.pointerEvents = 'none';

    try {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '794px';
        
        const clone = originalElement.cloneNode(true);
        clone.style.width = '794px';
        clone.style.height = '1123px';
        clone.style.margin = '0';
        clone.style.padding = '40px';
        clone.style.boxSizing = 'border-box';
        clone.style.display = 'flex';
        clone.style.flexDirection = 'column';
        clone.style.justifyContent = 'space-between';
        clone.style.backgroundColor = 'white';

        container.appendChild(clone);
        document.body.appendChild(container);

        await new Promise(resolve => setTimeout(resolve, 800));

        const options = {
            margin: 0,
            filename: `Certificado_NovaRegistry_${starCode}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true, scrollY: 0, windowWidth: 794 },
            jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait', hotfixes: ['px_scaling'] }
        };

        await html2pdf().set(options).from(clone).save();
        document.body.removeChild(container);
        btn.innerHTML = originalText;
    } catch (error) {
        console.error("Error crítico en PDF:", error);
        btn.innerHTML = "Reintentar";
    } finally {
        btn.style.pointerEvents = 'auto';
    }
}

function toggleMenu() { document.querySelector('.nav-links').classList.toggle('active'); }

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active-link'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelector('.nav-links').classList.remove('active');
    
    if(sectionId === 'home') document.getElementById('link-home').classList.add('active-link');
    if(sectionId === 'firmamento') {
        document.getElementById('link-firm').classList.add('active-link');
        if(!canvasInitialized) initBackgroundSky();
    }
    if(sectionId === 'mystar') document.getElementById('link-mystar').classList.add('active-link');
    if(sectionId === 'ia-locator') document.getElementById('link-ia').classList.add('active-link');
    if(sectionId === 'admin-panel' && document.getElementById('link-admin')) document.getElementById('link-admin').classList.add('active-link');
}

// --- SISTEMA DE ESTRELLAS FONDO (PARTÍCULAS) ---
const canvas = document.getElementById('skyCanvas');
const ctx = canvas.getContext('2d');
let backgroundStars = [];
let canvasInitialized = false;
let rotAngle = 0, targetOffsetX = 0, targetOffsetY = 0, currentOffsetX = 0, currentOffsetY = 0;

window.addEventListener('mousemove', (e) => {
    const centerX = window.innerWidth / 2; const centerY = window.innerHeight / 2;
    targetOffsetX = (e.clientX - centerX) * 0.05; targetOffsetY = (e.clientY - centerY) * 0.05;
});

function initBackgroundSky() {
    canvasInitialized = true; resizeCanvas(); window.addEventListener('resize', resizeCanvas);
    const spectralColors = ['#9bb0ff', '#aabfff', '#ffffff', '#ffebca', '#ffcc6f', '#ff9632', '#ff2a00'];
    for(let i=0; i<800; i++) {
        let size = Math.random() * 2 + 0.2; let color = spectralColors[Math.floor(Math.random() * spectralColors.length)];
        backgroundStars.push({ x: Math.random() * 3000 - 1500, y: Math.random() * 3000 - 1500, z: Math.random() * 2 + 0.1, size: size, baseColor: color, alpha: Math.random() * 0.8 + 0.2 });
    }
    renderAmbientSky();
}

function resizeCanvas() { if(canvas.parentElement) { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; } }

function renderAmbientSky() {
    ctx.fillStyle = 'rgba(1, 2, 5, 0.4)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2; const cy = canvas.height / 2;
    rotAngle += 0.00015; const sinA = Math.sin(rotAngle); const cosA = Math.cos(rotAngle);
    currentOffsetX += (targetOffsetX - currentOffsetX) * 0.05; currentOffsetY += (targetOffsetY - currentOffsetY) * 0.05;

    backgroundStars.forEach(star => {
        const rotX = star.x * cosA - star.y * sinA; const rotY = star.y * cosA + star.x * sinA;
        const screenX = rotX + cx + (currentOffsetX * star.z); const screenY = rotY + cy + (currentOffsetY * star.z);
        if(screenX > -10 && screenX < canvas.width + 10 && screenY > -10 && screenY < canvas.height + 10) {
            let flicker = star.alpha + Math.sin(Date.now() * 0.001 * star.z) * 0.3;
            flicker = Math.max(0.1, Math.min(1, flicker));
            ctx.beginPath(); ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2); 
            let r = parseInt(star.baseColor.slice(1, 3), 16); let g = parseInt(star.baseColor.slice(3, 5), 16); let b = parseInt(star.baseColor.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${flicker})`; ctx.fill();
        }
    });
    requestAnimationFrame(renderAmbientSky);
}

// --- PROCESO DE PAGO Y REGISTRO ---
let checkoutPackage = "";
let starNamePending = "";
let paypalButtonsRendered = false;

function openPayment(packageName) {
    let rawInput = document.getElementById('inputStarName').value;
    starNamePending = rawInput.replace(/[^\w\s\u00C0-\u024F]/gu, '').trim();
    if(starNamePending === "") { alert("Por favor, introduce el nombre."); return; }
    checkoutPackage = packageName;

    document.getElementById('checkoutDesc').innerText = "Registro: " + packageName;
    document.getElementById('paymentModal').style.display = 'flex';

    // Bypass Admin
    const oldAdminBtn = document.getElementById('admin-bypass-btn');
    if (oldAdminBtn) oldAdminBtn.remove();
    if (isAdminActive) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'admin-bypass-btn';
        adminBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> REGISTRO DIRECTO ADMIN';
        adminBtn.style = "width:100%; background:#2ecc71; color:black; padding:15px; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:20px;";
        const paypalContainer = document.getElementById('paypal-button-container');
        paypalContainer.parentNode.insertBefore(adminBtn, paypalContainer);

        adminBtn.onclick = async () => {
            const newId = "NOVA-" + Math.floor(10000 + Math.random() * 90000);
            const starData = {
                id: newId, name: starNamePending.toUpperCase(), date: new Date().toLocaleDateString('es-ES'),
                pack: checkoutPackage, official: "HD " + Math.floor(Math.random() * 200000),
                ra: "12h 00m", dec: "+00°", lore: "Registrada vía Admin.", timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection("estrellas").doc(newId).set(starData);
            alert("¡Éxito! Código: " + newId);
            document.getElementById('myStarInput').value = newId;
            loadMyStar();
            document.getElementById('paymentModal').style.display = 'none';
        };
    }
}

// --- FUNCIÓN DEL BUSCADOR (IA TRACKER / CERTIFICADO) ---
async function loadMyStar() {
    const inputField = document.getElementById('myStarInput');
    const input = inputField.value.toUpperCase().replace(/\s+/g, '');
    if(!input) return;

    try {
        const docRef = await db.collection("estrellas").doc(input).get();
        if (docRef.exists) {
            const star = docRef.data();
            showSection('mystar'); 
            document.getElementById('loginStar').style.display = 'none';
            document.getElementById('certificatePanel').style.display = 'flex';

            // Rellenar certificado
            document.getElementById('certId').innerText = star.id;
            document.getElementById('certOfficialCodeTop').innerText = star.official || "--"; 
            document.getElementById('certDate').innerText = star.date;
            document.getElementById('certName').innerText = star.name;
            document.getElementById('certOfficial').innerText = star.official || "--";
            document.getElementById('certRA').innerText = star.ra || "--";
            document.getElementById('certDEC').innerText = star.dec || "--";
            document.getElementById('certDist').innerText = star.distance || "--";
            document.getElementById('certClass').innerText = star.spectral || "--";
            document.getElementById('certTemp').innerText = star.temp || "--";
            document.getElementById('certAppMag').innerText = star.appMag || "--";
            document.getElementById('certLum').innerText = star.lum || "--";
            document.getElementById('certLore').innerText = star.lore || "";
            document.getElementById('certBarcode').innerText = star.id;

            // [CORRECCIÓN 2] QR DINÁMICO Y VISIBLE
            const qrImage = document.getElementById('certQR');
            if (qrImage) {
                // Genera la URL dinámicamente según dónde esté alojada la web (Vercel o .net)
                const verifyUrl = `${window.location.origin}/?verify=${star.id}`;
                qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
                qrImage.style.display = 'block'; // [CORRECCIÓN 3] Asegurar que pase de none a block
            }

        } else { alert('Código no encontrado.'); }
    } catch (error) { console.error(error); }
}

// --- TELEMETRÍA IA ---
function parseCoordToDeg(coord, isRA) { return 0; } // Simplificado para brevedad, mantén tu función si es compleja

function getAltAz(lat, lon, raDeg, decDeg) {
    let now = new Date();
    let d = Math.round((now.getTime() - new Date("2000-01-01T12:00:00Z").getTime()) / 86400000);
    let lst = (100.46 + 0.985647 * d + lon + 15 * (now.getUTCHours() + now.getUTCMinutes()/60)) % 360;
    let ha = (lst - raDeg + 360) % 360; let rad = Math.PI / 180;
    let sinAlt = Math.sin(lat*rad)*Math.sin(decDeg*rad) + Math.cos(lat*rad)*Math.cos(decDeg*rad)*Math.cos(ha*rad);
    let alt = Math.asin(sinAlt) / rad;
    return { alt: parseFloat(alt.toFixed(1)), az: 180 };
}

async function triggerAILocator() {
    const input = document.getElementById('aiInput').value.toUpperCase().replace(/\s+/g, '');
    const outputArea = document.getElementById('aiOutput');
    if(!input) return;
    outputArea.innerHTML = '> Obteniendo telemetría...';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((p) => processTracking(input, p.coords.latitude, p.coords.longitude, outputArea));
    }
}

async function processTracking(input, lat, lon, outputArea) {
    const doc = await db.collection("estrellas").doc(input).get();
    if (doc.exists) {
        outputArea.innerHTML = `> [ ÉXITO ] OBJETIVO: ${doc.data().name}<br>> Lat: ${lat.toFixed(2)} Lon: ${lon.toFixed(2)}`;
    } else { outputArea.innerHTML = '> ERROR 404'; }
}

async function loadAdminDashboard() {
    if(!isAdminActive) return;
    const snapshot = await db.collection("estrellas").get();
    let rows = '';
    snapshot.forEach(doc => {
        const data = doc.data();
        rows += `<tr><td>${data.date}</td><td>${data.id}</td><td>-</td><td>-</td><td>-</td><td>${data.name}</td><td>Digital</td></tr>`;
    });
    document.getElementById('adminTableBody').innerHTML = rows;
}
