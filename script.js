    // === 1. ESTADO GLOBAL E INICIALIZACIÓN ===
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
let canvasInitialized = false; // Movido aquí para evitar errores de ReferenceError
let checkoutPackage = "";
let starNamePending = "";
let paypalButtonsRendered = false;

// === 2. GESTIÓN DE COOKIES Y TEXTOS LEGALES ===
document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("cookiesAccepted")) {
        const banner = document.getElementById("cookieBanner");
        if (banner) banner.style.display = "flex";
    }
});

function acceptCookies() {
    localStorage.setItem("cookiesAccepted", "true");
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.style.display = "none";
}

const legalTexts = {
    'Aviso Legal': `
        <strong style="color: var(--gold-main);">1. Datos Identificativos</strong><br>
        Sitio web operado por NovaRegistry, servicio de archivo astrométrico de carácter conmemorativo.<br><br>
        <strong style="color: var(--gold-main);">2. Naturaleza del Servicio</strong><br>
        Los nombres asignados se archivan en nuestra base de datos privada. Este servicio <strong>NO</strong> cuenta con reconocimiento oficial por la IAU.`,
    'Política de Privacidad': `
        <strong style="color: var(--gold-main);">Tratamiento de Datos</strong><br>
        Cumplimos con el RGPD. Utilizamos cookies de PayPal para procesar pagos seguros.`,
    'Términos y Condiciones': `
        <strong style="color: var(--gold-main);">Desistimiento</strong><br>
        Al ser bienes personalizados, <strong>no es aplicable</strong> el derecho de desistimiento una vez adjudicado el certificado.`
};

function openLegalModal(type) {
    document.getElementById('legalTitle').innerText = type;
    document.getElementById('legalContent').innerHTML = legalTexts[type];
    document.getElementById('legalModal').style.display = 'flex';
}

// === 3. NAVEGACIÓN Y MENÚ ===
function toggleMenu() { document.querySelector('.nav-links').classList.toggle('active'); }

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active-link'));
    
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
    
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

// === 4. SISTEMA DE VERIFICACIÓN (IA TRACKER / MY STAR) ===
async function loadMyStar() {
    const inputField = document.getElementById('myStarInput');
    if (!inputField) return;

    const input = inputField.value.toUpperCase().replace(/\s+/g, '');
    if (!input) {
        alert("Por favor, introduce un código de registro.");
        return;
    }

    try {
        const docRef = await db.collection("estrellas").doc(input).get();

        if (docRef.exists) {
            const star = docRef.data();
            
            // Ocultar buscador y mostrar panel de certificado
            document.getElementById('loginStar').style.display = 'none';
            document.getElementById('certificatePanel').style.display = 'flex';

            // Rellenar datos
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

            // Generar QR
            const qrImage = document.getElementById('certQR');
            const urlEstrella = "https://www.novaregistry.net/?verify=" + star.id;
            qrImage.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(urlEstrella);
        } else {
            alert('Código NOVA no encontrado en los archivos.');
        }
    } catch (error) {
        console.error("Error cargando estrella:", error);
        alert("Error de conexión con el archivo central.");
    }
}

// === 5. PASARELA DE PAGO Y MODO ADMIN ===
function handleLogoClick() {
    showSection('home');
    let currentTime = new Date().getTime();
    if (currentTime - lastClickTime > 1500) { adminClickCount = 0; }
    adminClickCount++;
    lastClickTime = currentTime;

    if (adminClickCount === 5) {
        adminClickCount = 0;
        let adminModalHtml = `
            <div id="adminLogin" style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#111; padding:20px; border:1px solid gold; z-index:9999; border-radius: 8px;">
                <h4 style="color: gold; margin-bottom: 10px;">Acceso STAFF</h4>
                <input type="email" id="admE" placeholder="Email"><br><br>
                <input type="password" id="admP" placeholder="Password"><br><br>
                <button onclick="loginAdmin()" style="background: gold; border:none; padding: 5px 15px; cursor:pointer;">Entrar</button> 
                <button onclick="document.getElementById('adminLogin').remove()" style="background: transparent; color: white; border: 1px solid #444; margin-left: 5px;">X</button>
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
        const navAdmin = document.getElementById('nav-admin');
        if (navAdmin) navAdmin.style.display = 'inline-block';
        document.getElementById('adminLogin').remove();
    }).catch(() => alert("Acceso denegado."));
}

function openPayment(packageName) {
    let rawInput = document.getElementById('inputStarName').value;
    starNamePending = rawInput.replace(/[^\w\s\u00C0-\u024F]/gu, '').trim();
    
    if(starNamePending === "") { 
        alert("Por favor, introduce un nombre para la estrella."); return; 
    }
    
    checkoutPackage = packageName;
    const legalCheckbox = document.getElementById('legalConsent');
    if (legalCheckbox) legalCheckbox.checked = false; 

    const formEnvio = document.getElementById('shipping-form');
    formEnvio.style.display = (packageName.includes("Herencia") || packageName.includes("Soberanía") || packageName.includes("Físico") || packageName.includes("VIP")) ? 'block' : 'none';

    document.getElementById('checkoutDesc').innerText = "Adjudicación: " + packageName;
    document.getElementById('paymentModal').style.display = 'flex';

    // Bypass Admin
    const oldAdminBtn = document.getElementById('admin-bypass-btn');
    if (oldAdminBtn) oldAdminBtn.remove();

    if (isAdminActive) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'admin-bypass-btn';
        adminBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> REGISTRO GRATUITO (STAFF)';
        adminBtn.style = "width:100%; background:#2ecc71; color:black; padding:15px; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:20px;";
        const paypalContainer = document.getElementById('paypal-button-container');
        paypalContainer.parentNode.insertBefore(adminBtn, paypalContainer);

        adminBtn.onclick = async () => {
            if(!document.getElementById('legalConsent').checked) { alert("Acepta los términos."); return; }
            if(confirm("¿Generar registro Staff para '" + starNamePending + "'?")) {
                const overlay = document.getElementById('processingOverlay');
                overlay.style.display = 'flex';
                document.getElementById('paymentModal').style.display = 'none';

                try {
                    const randomNum = Math.floor(10000 + Math.random() * 90000);
                    const newNovaCode = "NOVA-" + randomNum;
                    const fechaActual = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                    const mitologias = ["Conocida como el faro eterno...", "Una joya radiante en el tejido cósmico...", "Dice la leyenda que nació de un suspiro..."];
                    const lore = mitologias[Math.floor(Math.random() * mitologias.length)];

                    const starData = {
                        id: newNovaCode,
                        name: starNamePending.toUpperCase(),
                        date: fechaActual,
                        package: checkoutPackage,
                        official: "HD " + Math.floor(Math.random() * 200000) + " (Nova)",
                        ra: "15h 34m 41s", dec: "+26° 42' 52\"", distance: "75 A.L.", spectral: "A0 V", temp: "9750 K", appMag: "2.22", lum: "60 Soles",
                        lore: lore, timestamp: new Date().getTime()
                    };

                    await db.collection("estrellas").doc(newNovaCode).set(starData);
                    overlay.style.display = 'none';
                    showSection('mystar');
                    document.getElementById('myStarInput').value = newNovaCode;
                    loadMyStar();
                } catch (e) { overlay.style.display = 'none'; alert("Error DB."); }
            }
        };
    }

    if (!paypalButtonsRendered) {
        paypal.Buttons({
            style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'pay' },
            createOrder: async function(data, actions) { 
                if(!document.getElementById('legalConsent').checked) { alert("Acepta los términos."); return actions.reject(); }
                const respuesta = await fetch('/api/crear-orden', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paqueteId: checkoutPackage })
                });
                const ordenSegura = await respuesta.json();
                return ordenSegura.id; 
            },
            onApprove: async function(data, actions) {
                const details = await actions.order.capture();
                const overlay = document.getElementById('processingOverlay');
                overlay.style.display = 'flex';
                document.getElementById('paymentModal').style.display = 'none';
                const resFirebase = await fetch('/api/guardar-estrella', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paqueteId: checkoutPackage,
                        starName: starNamePending,
                        payerName: details.payer.name.given_name,
                        paypalTransactionId: details.id
                    })
                });
                const resultado = await resFirebase.json();
                overlay.style.display = 'none';
                if(resultado.success) {
                    showSection('mystar');
                    document.getElementById('myStarInput').value = resultado.novaCode;
                    loadMyStar();
                }
            }
        }).render('#paypal-button-container');
        paypalButtonsRendered = true;
    }
}

// === 6. GENERADOR DE PDF (ALTA CALIDAD) ===
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
            html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, windowWidth: 794 },
            jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait', hotfixes: ['px_scaling'] }
        };

        await html2pdf().set(options).from(clone).save();
        document.body.removeChild(container);
        btn.innerHTML = originalText;
    } catch (error) {
        btn.innerHTML = "Reintentar";
    } finally {
        btn.style.pointerEvents = 'auto';
    }
}

// === 7. SISTEMA VR / BACKGROUND SKY ===
const canvas = document.getElementById('skyCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let backgroundStars = [];
let rotAngle = 0, targetOffsetX = 0, targetOffsetY = 0, currentOffsetX = 0, currentOffsetY = 0;

window.addEventListener('mousemove', (e) => {
    const centerX = window.innerWidth / 2; const centerY = window.innerHeight / 2;
    targetOffsetX = (e.clientX - centerX) * 0.05; targetOffsetY = (e.clientY - centerY) * 0.05;
});

function initBackgroundSky() {
    if (!ctx) return;
    canvasInitialized = true; 
    resizeCanvas(); 
    window.addEventListener('resize', resizeCanvas);
    const spectralColors = ['#9bb0ff', '#aabfff', '#ffffff', '#ffebca', '#ffcc6f', '#ff9632', '#ff2a00'];
    for(let i=0; i<800; i++) {
        backgroundStars.push({ 
            x: Math.random() * 3000 - 1500, 
            y: Math.random() * 3000 - 1500, 
            z: Math.random() * 2 + 0.1, 
            size: Math.random() * 2 + 0.2, 
            baseColor: spectralColors[Math.floor(Math.random() * spectralColors.length)], 
            alpha: Math.random() * 0.8 + 0.2 
        });
    }
    renderAmbientSky();
}

function resizeCanvas() { if(canvas && canvas.parentElement) { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; } }

function renderAmbientSky() {
    if (!ctx) return;
    ctx.fillStyle = 'rgba(1, 2, 5, 0.4)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2; const cy = canvas.height / 2;
    rotAngle += 0.00015; const sinA = Math.sin(rotAngle); const cosA = Math.cos(rotAngle);
    currentOffsetX += (targetOffsetX - currentOffsetX) * 0.05; currentOffsetY += (targetOffsetY - currentOffsetY) * 0.05;

    backgroundStars.forEach(star => {
        const rotX = star.x * cosA - star.y * sinA; const rotY = star.y * cosA + star.x * sinA;
        const screenX = rotX + cx + (currentOffsetX * star.z); const screenY = rotY + cy + (currentOffsetY * star.z);
        if(screenX > -10 && screenX < canvas.width + 10 && screenY > -10 && screenY < canvas.height + 10) {
            let flicker = Math.max(0.1, Math.min(1, star.alpha + Math.sin(Date.now() * 0.001 * star.z) * 0.3));
            ctx.beginPath(); ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2); 
            ctx.fillStyle = star.baseColor.replace(')', `, ${flicker})`).replace('rgb', 'rgba').replace('#', 'rgba('); // Simplificación
            ctx.fillStyle = `rgba(255,255,255,${flicker})`; // Color genérico por estabilidad
            ctx.fill();
        }
    });
    requestAnimationFrame(renderAmbientSky);
}

// === 8. IA TRACKER Y DASHBOARD (EL RESTO DEL CÓDIGO) ===
// (Mantén tus funciones parseCoordToDeg, getAltAz, triggerAILocator, processTracking y loadAdminDashboard al final)
