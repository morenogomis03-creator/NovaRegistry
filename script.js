// === INICIALIZACIÓN DE FIREBASE Y VARIABLES ===
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

// === LECTURA DE QR AUTOMÁTICA ===
// Si el cliente escanea el QR, la URL tendrá "?verify=NOVA-XXXX"
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyCode = urlParams.get('verify');
    if(verifyCode) {
        showSection('mystar');
        document.getElementById('myStarInput').value = verifyCode;
        loadMyStar();
    }
};

// === NAVEGACIÓN Y MENÚS ===
function toggleMenu() { document.querySelector('.nav-links').classList.toggle('active'); }
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active-link'));
    document.getElementById(sectionId).classList.add('active');
    
    if(sectionId === 'home') document.getElementById('link-home').classList.add('active-link');
    if(sectionId === 'firmamento') {
        document.getElementById('link-firm').classList.add('active-link');
        if(!canvasInitialized) initBackgroundSky();
    }
    if(sectionId === 'mystar') document.getElementById('link-mystar').classList.add('active-link');
    if(sectionId === 'ia-locator') document.getElementById('link-ia').classList.add('active-link');
}

// === EFECTO PARALLAX VR (CIELO ESTRELLADO) ===
const canvas = document.getElementById('skyCanvas');
let backgroundStars = [], canvasInitialized = false;
let rotAngle = 0, targetOffsetX = 0, targetOffsetY = 0, currentOffsetX = 0, currentOffsetY = 0;

window.addEventListener('mousemove', (e) => {
    const centerX = window.innerWidth / 2; const centerY = window.innerHeight / 2;
    targetOffsetX = (e.clientX - centerX) * 0.05; targetOffsetY = (e.clientY - centerY) * 0.05;
});

function initBackgroundSky() {
    canvasInitialized = true; 
    const ctx = canvas.getContext('2d');
    function resizeCanvas() { if(canvas.parentElement) { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; } }
    resizeCanvas(); window.addEventListener('resize', resizeCanvas);
    
    const colors = ['#9bb0ff', '#ffffff', '#ffebca', '#ff9632'];
    for(let i=0; i<800; i++) {
        backgroundStars.push({ x: Math.random() * 3000 - 1500, y: Math.random() * 3000 - 1500, z: Math.random() * 2 + 0.1, size: Math.random() * 2 + 0.2, baseColor: colors[Math.floor(Math.random() * colors.length)], alpha: Math.random() * 0.8 + 0.2 });
    }
    
    function render() {
        ctx.fillStyle = 'rgba(1, 2, 5, 0.4)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        rotAngle += 0.00015; currentOffsetX += (targetOffsetX - currentOffsetX) * 0.05; currentOffsetY += (targetOffsetY - currentOffsetY) * 0.05;
        backgroundStars.forEach(star => {
            const rotX = star.x * Math.cos(rotAngle) - star.y * Math.sin(rotAngle); 
            const rotY = star.y * Math.cos(rotAngle) + star.x * Math.sin(rotAngle);
            const screenX = rotX + canvas.width/2 + (currentOffsetX * star.z); 
            const screenY = rotY + canvas.height/2 + (currentOffsetY * star.z);
            if(screenX > 0 && screenX < canvas.width && screenY > 0 && screenY < canvas.height) {
                ctx.beginPath(); ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2); 
                ctx.fillStyle = star.baseColor; ctx.globalAlpha = star.alpha; ctx.fill(); ctx.globalAlpha = 1;
            }
        });
        requestAnimationFrame(render);
    }
    render();
}

// === LÓGICA DE PAGOS (LA BÓVEDA) ===
let checkoutPackage = "", starNamePending = "", paypalButtonsRendered = false;

function openPayment(packageName) {
    let rawInput = document.getElementById('inputStarName').value;
    starNamePending = rawInput.replace(/[^\w\s\u00C0-\u024F]/gu, '').trim();
    if(!starNamePending) { alert("Introduzca un Nombre Oficial válido."); return; }
    
    checkoutPackage = packageName;
    document.getElementById('checkoutDesc').innerText = packageName;
    document.getElementById('paymentModal').style.display = 'flex';

    if (!paypalButtonsRendered) {
        paypal.Buttons({
            style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'pay' },
            createOrder: async function(data, actions) { 
                if(!document.getElementById('legalConsent').checked) { alert("Acepta los Términos de Venta."); return actions.reject(); }
                const res = await fetch('/api/crear-orden', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paqueteId: checkoutPackage }) });
                const order = await res.json();
                if (!res.ok) { alert("Error de seguridad: " + order.error); throw new Error(order.error); }
                return order.id; 
            },
            onApprove: async function(data, actions) {
                const details = await actions.order.capture();
                document.getElementById('processingOverlay').style.display = 'flex';
                document.getElementById('paymentModal').style.display = 'none';

                const resFirebase = await fetch('/api/guardar-estrella', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paqueteId: checkoutPackage, starName: starNamePending, payerName: details.payer.name.given_name, paypalTransactionId: details.id }) });
                const resultado = await resFirebase.json();
                document.getElementById('processingOverlay').style.display = 'none';

                if(resultado.success) {
                    alert(`¡COMPRA CONFIRMADA!\nCódigo: ${resultado.novaCode}`);
                    showSection('mystar'); document.getElementById('myStarInput').value = resultado.novaCode; loadMyStar();
                } else { alert("Error al contactar con el Registro Central."); }
            }
        }).render('#paypal-button-container');
        paypalButtonsRendered = true;
    }
}
function closePaymentModal() { document.getElementById('paymentModal').style.display = 'none'; }

// === GENERADOR DE CERTIFICADOS Y CÓDIGO QR ===
async function loadMyStar() {
    const input = document.getElementById('myStarInput').value.toUpperCase().replace(/\s+/g, '');
    if(!input) return;
    try {
        const docRef = await db.collection("estrellas").doc(input).get();
        if (docRef.exists) {
            const star = docRef.data();
            document.getElementById('loginStar').style.display = 'none';
            document.getElementById('certificatePanel').style.display = 'flex';

            document.getElementById('certId').innerText = star.id;
            document.getElementById('certName').innerText = star.name;
            document.getElementById('certDate').innerText = star.date;
            
            // MAGIA: Generador de QR Dinámico. Apunta a tu web con el código de la estrella.
            const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(`https://www.novaregistry.net/?verify=${star.id}`);
            document.getElementById('certQR').src = qrUrl;

        } else { alert('Código no localizado en el registro oficial.'); }
    } catch (error) { alert("Fallo de conexión."); }
}

function downloadPDF() {
    const originalElement = document.getElementById('pdf-content');
    const btn = document.getElementById('downloadPdfBtn');
    btn.innerHTML = 'Procesando PDF...'; btn.style.pointerEvents = 'none';
    const clone = originalElement.cloneNode(true);
    const wrapper = document.createElement('div'); wrapper.className = 'pdf-clone-wrapper'; wrapper.appendChild(clone); document.body.appendChild(wrapper);

    setTimeout(() => {
        html2pdf().set({ margin: 0, filename: `Certificado_${document.getElementById('certId').innerText}.pdf`, image: { type: 'jpeg', quality: 1.0 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' } }).from(clone).save().then(() => {
            document.body.removeChild(wrapper); btn.innerHTML = 'Descargar PDF'; btn.style.pointerEvents = 'auto';
        });
    }, 150);
}

// === IA TRACKER CON RADAR VISUAL (AR) ===
function parseCoordToDeg(coordStr, isRA) {
    if(!coordStr) return 0;
    let match = isRA ? coordStr.match(/(\d+)h\s*(\d+)m\s*(\d+)s/) : coordStr.match(/([+-]?\d+)°\s*(\d+)'\s*(\d+)/);
    if (!match) return 0;
    if (isRA) return (parseFloat(match[1]) + parseFloat(match[2])/60 + parseFloat(match[3])/3600) * 15;
    let sign = coordStr.includes('-') ? -1 : 1;
    return sign * (Math.abs(parseFloat(match[1])) + parseFloat(match[2])/60 + parseFloat(match[3])/3600);
}

function getAltAz(lat, lon, raDeg, decDeg) {
    let now = new Date(), d = Math.round((now.getTime() - new Date("2000-01-01T12:00:00Z").getTime()) / 86400000);
    let lst = (100.46 + 0.985647 * d + lon + 15 * (now.getUTCHours() + now.getUTCMinutes()/60)) % 360;
    let ha = lst - raDeg, rad = Math.PI / 180;
    let sinAlt = Math.sin(lat*rad)*Math.sin(decDeg*rad) + Math.cos(lat*rad)*Math.cos(decDeg*rad)*Math.cos(ha*rad);
    let alt = Math.asin(sinAlt) / rad;
    let cosA = (Math.sin(decDeg*rad) - Math.sin(alt*rad)*Math.sin(lat*rad)) / (Math.cos(alt*rad)*Math.cos(lat*rad));
    let az = Math.acos(Math.max(-1, Math.min(1, cosA))) / rad;
    return { alt: parseFloat(alt.toFixed(1)), az: parseFloat((Math.sin(ha*rad) > 0 ? 360 - az : az).toFixed(1)) };
}

async function triggerAILocator() {
    const input = document.getElementById('aiInput').value.toUpperCase().replace(/\s+/g, '');
    const out = document.getElementById('aiOutput');
    if(!input) return out.innerHTML = '<span style="color:red;">Error: Código vacío</span>';
    out.innerHTML = '> Calculando telemetría...<br>> Activando brújula...';
    
    navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => doTrack(input, p.coords.latitude, p.coords.longitude, out), () => doTrack(input, 40.41, -3.70, out)) : doTrack(input, 40.41, -3.70, out);
}

async function doTrack(input, lat, lon, out) {
    const docRef = await db.collection("estrellas").doc(input).get();
    if (!docRef.exists) return out.innerHTML = '<span style="color:red;">Código no existe.</span>';
    const star = docRef.data(), coords = getAltAz(lat, lon, parseCoordToDeg(star.ra||"0h 0m 0s", true), parseCoordToDeg(star.dec||"0° 0' 0", false));
    
    out.innerHTML = `
        <div style="color: #00ff66;">> OBJETIVO FIJADO: ${star.name}</div>
        <div>Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}</div>
        <div style="margin-top:10px;">Elevación: ${coords.alt}° | Azimut: ${coords.az}°</div>
        <div class="radar-compass"><div class="radar-needle" style="transform: translateX(-50%) rotate(${coords.az}deg);"></div></div>
        <div style="color: var(--accent-blue); text-align:center;">Gira con tu brújula hacia los ${coords.az}°</div>`;
}

function openLegalModal(type) { document.getElementById('legalModal').style.display='flex'; }
