// --- SISTEMA DE NOTIFICACIONES TOAST ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 3500);
}

// --- GESTIÓN DE COOKIES Y URL AUTOMÁTICA ---
document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("cookiesAccepted")) {
        const banner = document.getElementById("cookieBanner");
        if (banner) banner.style.display = "flex";
    }

    // Detector del QR
    const urlParams = new URLSearchParams(window.location.search);
    const starIdFromUrl = urlParams.get('verify');
    if (starIdFromUrl) {
        const inputField = document.getElementById('myStarInput');
        if (inputField) {
            inputField.value = starIdFromUrl;
            loadMyStar(); 
        }
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
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), le informamos que este sitio web es operado por TU NOMBRE/EMPRESA, con NIF/CIF TU_NIF, domicilio en TU_DIRECCIÓN.<br><br>
        <strong style="color: var(--gold-main);">2. Naturaleza del Servicio</strong><br>
        NovaRegistry ofrece un servicio de archivo astrométrico de carácter conmemorativo. Este servicio <strong>NO</strong> cuenta con reconocimiento oficial por parte de la Unión Astronómica Internacional (IAU).
    `,
    'Política de Privacidad': `
        <strong style="color: var(--gold-main);">1. Responsable del Tratamiento</strong><br>
        En cumplimiento con el Reglamento (UE) 2016/679 (RGPD), protegemos sus datos.<br><br>
        <strong style="color: var(--gold-main);">2. Cookies y Análisis</strong><br>
        Utilizamos cookies de terceros (como PayPal) estrictamente necesarias para procesar pagos seguros en la plataforma.
    `,
    'Términos y Condiciones': `
        <strong style="color: var(--gold-main);">1. Objeto y Desistimiento</strong><br>
        De acuerdo con el artículo 103 de la Ley General para la Defensa de los Consumidores y Usuarios, el derecho de desistimiento <strong>NO es aplicable</strong> a bienes confeccionados conforme a las especificaciones del consumidor.
    `
};

function openLegalModal(type) {
    document.getElementById('legalTitle').innerText = type;
    document.getElementById('legalContent').innerHTML = legalTexts[type];
    document.getElementById('legalModal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
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
        showToast("🚀 MODO ADMIN ACTIVADO.", "success");
        document.getElementById('nav-admin').style.display = 'inline-block';
        document.getElementById('adminLogin').remove();
        loadAdminDashboard();
    }).catch(() => showToast("Acceso denegado. Credenciales inválidas.", "error"));
}

// --- GENERADOR DE PDF ---
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
        showToast("Certificado PDF descargado correctamente.", "success");

    } catch (error) {
        showToast("Error al generar el archivo PDF. Inténtalo de nuevo.", "error");
        btn.innerHTML = "Reintentar";
    } finally {
        btn.style.pointerEvents = 'auto';
    }
}

// --- SISTEMA VR / PARALLAX BLINDADO ---
let canvas;
let ctx;
let backgroundStars = [];
let canvasInitialized = false;
let rotAngle = 0, targetOffsetX = 0, targetOffsetY = 0, currentOffsetX = 0, currentOffsetY = 0;

window.addEventListener('mousemove', (e) => {
    const centerX = window.innerWidth / 2; const centerY = window.innerHeight / 2;
    targetOffsetX = (e.clientX - centerX) * 0.05; targetOffsetY = (e.clientY - centerY) * 0.05;
});

function initBackgroundSky() {
    canvas = document.getElementById('skyCanvas');
    if (!canvas) return; 
    
    ctx = canvas.getContext('2d');
    canvasInitialized = true; 
    resizeCanvas(); 
    window.addEventListener('resize', resizeCanvas);
    
    const spectralColors = ['#9bb0ff', '#aabfff', '#ffffff', '#ffebca', '#ffcc6f', '#ff9632', '#ff2a00'];
    backgroundStars = [];
    for(let i=0; i<800; i++) {
        let size = Math.random() * 2 + 0.2; 
        let color = spectralColors[Math.floor(Math.random() * spectralColors.length)];
        backgroundStars.push({ x: Math.random() * 3000 - 1500, y: Math.random() * 3000 - 1500, z: Math.random() * 2 + 0.1, size: size, baseColor: color, alpha: Math.random() * 0.8 + 0.2 });
    }
    renderAmbientSky();
}

function resizeCanvas() { 
    if(canvas && canvas.parentElement) { 
        canvas.width = canvas.parentElement.clientWidth; 
        canvas.height = canvas.parentElement.clientHeight; 
    } 
}

function renderAmbientSky() {
    if (!ctx || !canvas) return;
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
}

// --- LÓGICA DE PAGOS ---
let checkoutPackage = "";
let starNamePending = "";
let paypalButtonsRendered = false;

function openPayment(packageName) {
    let rawInput = document.getElementById('inputStarName').value;
    starNamePending = rawInput.replace(/[^\w\s\u00C0-\u024F]/gu, '').trim();
    
    if(starNamePending === "") { 
        showToast("Por favor, introduce el nombre oficial para la estrella.", "warning"); 
        return; 
    }
    
    checkoutPackage = packageName;

    const legalCheckbox = document.getElementById('legalConsent');
    if (legalCheckbox) legalCheckbox.checked = false; 

    const formEnvio = document.getElementById('shipping-form');
    formEnvio.style.display = (packageName.includes("Premium") || packageName.includes("VIP")) ? 'block' : 'none';

    document.getElementById('checkoutDesc').innerText = "Registro: " + packageName;
    document.getElementById('paymentModal').style.display = 'flex';

    const oldAdminBtn = document.getElementById('admin-bypass-btn');
    if (oldAdminBtn) oldAdminBtn.remove();

    if (isAdminActive) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'admin-bypass-btn';
        adminBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> REGISTRO GRATUITO (ADMIN)';
        adminBtn.style = "width:100%; background:#2ecc71; color:black; padding:15px; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:20px; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);";
        
        const paypalContainer = document.getElementById('paypal-button-container');
        paypalContainer.parentNode.insertBefore(adminBtn, paypalContainer);

        adminBtn.onclick = async () => {
            if(!document.getElementById('legalConsent').checked) {
                showToast("Debes aceptar los términos de venta para proceder.", "warning");
                return;
            }

            if(confirm("¿Confirmar alta directa para '" + starNamePending + "'?")) {
                const overlay = document.getElementById('processingOverlay');
                overlay.style.display = 'flex';
                document.getElementById('paymentModal').style.display = 'none';

                try {
                    const newId = "NOVA-" + Math.floor(10000 + Math.random() * 90000);
                    const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

                    const mitologias = [
                        "Conocida como el faro eterno, esta estrella ha guiado a exploradores a través de los siglos.",
                        "Una joya radiante en el tejido cósmico que simboliza la sabiduría y la inmortalidad.",
                        "Dice la leyenda que esta estrella nació de un suspiro divino, destinada a brillar perpetuamente."
                    ];
                    const loreSeleccionado = mitologias[Math.floor(Math.random() * mitologias.length)];

                    const starData = {
                        id: newId,
                        name: starNamePending.toUpperCase(),
                        date: fecha,
                        pack: checkoutPackage,
                        official: "HD " + Math.floor(Math.random() * 200000),
                        ra: (Math.floor(Math.random() * 24)) + "h " + (Math.floor(Math.random() * 60)) + "m " + (Math.floor(Math.random() * 60)) + "s",
                        dec: (Math.random() > 0.5 ? "+" : "-") + Math.floor(Math.random() * 90) + "° " + Math.floor(Math.random() * 60) + "'",
                        distance: (Math.floor(Math.random() * 1000) + 10) + " A.L.",
                        spectral: "A0 V",
                        temp: (Math.floor(Math.random() * 5000) + 5000) + " K",
                        appMag: (Math.random() * 5 + 1).toFixed(2),
                        lum: Math.floor(Math.random() * 100) + " Soles",
                        lore: loreSeleccionado,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    await db.collection("estrellas").doc(newId).set(starData);

                    overlay.style.display = 'none';
                    showToast("¡Estrella registrada con éxito! Código: " + newId, "success");
                    
                    document.getElementById('myStarInput').value = newId;
                    loadMyStar(); 

                } catch (e) {
                    overlay.style.display = 'none';
                    console.error("Error al guardar:", e);
                    showToast("Error al conectar con la base de datos.", "error");
                }
            }
        };
    }

    if (!paypalButtonsRendered) {
        paypal.Buttons({
            style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'pay' },
            onClick: (data, actions) => {
                if(!document.getElementById('legalConsent').checked) {
                    showToast("Por favor, acepta los términos de venta.", "warning");
                    return actions.reject();
                }
                return actions.resolve();
            },
            createOrder: async function(data, actions) { 
                try {
                    const respuesta = await fetch('/api/crear-orden', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paqueteId: checkoutPackage })
                    });
                    const orden = await respuesta.json();
                    if (!respuesta.ok) throw new Error("Error en servidor");
                    return orden.id; 
                } catch (err) {
                    showToast("Error en la conexión con PayPal.", "error");
                }
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
                    showToast("Pago completado con éxito.", "success");
                    document.getElementById('myStarInput').value = resultado.novaCode;
                    loadMyStar();
                }
            }
        }).render('#paypal-button-container');
        paypalButtonsRendered = true;
    }
}

// === BUSCADOR (CERTIFICADO Y QR) ===
async function loadMyStar() {
    const inputField = document.getElementById('myStarInput');
    if(!inputField) return;
    
    const input = inputField.value.toUpperCase().replace(/\s+/g, '');
    if(!input) return showToast("Introduce un código NOVA.", "warning");

    try {
        const docRef = await db.collection("estrellas").doc(input).get();

        if (docRef.exists) {
            const star = docRef.data();
            
            showSection('mystar'); 
            document.getElementById('loginStar').style.display = 'none';
            document.getElementById('certificatePanel').style.display = 'flex';

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

            const qrImage = document.getElementById('certQR');
            if (qrImage) {
                const currentDomain = window.location.origin;
                const qrUrl = `${currentDomain}/?verify=${star.id}`;
                qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`;
                qrImage.style.display = 'block';
            }

            showToast("Certificado cargado correctamente.", "success");
        } else {
            showToast('Código no encontrado en nuestros archivos.', "error");
        }
    } catch (error) {
        showToast("Fallo al conectar con la base de datos.", "error");
    }
}

// === MATEMÁTICAS IA TRACKER ===
function parseCoordToDeg(coordStr, isRA) {
    if (!coordStr) return 0;
    let nums = coordStr.match(/-?\d+\.?\d*/g);
    if (!nums || nums.length === 0) return 0;
    let deg = parseFloat(nums[0]);
    let min = nums.length > 1 ? parseFloat(nums[1]) : 0;
    let sec = nums.length > 2 ? parseFloat(nums[2]) : 0;
    let total = Math.abs(deg) + (min / 60) + (sec / 3600);
    if (deg < 0 || coordStr.includes('-')) total = -total;
    if (isRA) return total * 15; 
    return total;
}

function getAltAz(lat, lon, raDeg, decDeg) {
    let now = new Date();
    let d = Math.round((now.getTime() - new Date("2000-01-01T12:00:00Z").getTime()) / 86400000);
    let lst = (100.46 + 0.985647 * d + lon + 15 * (now.getUTCHours() + now.getUTCMinutes()/60)) % 360;
    if (lst < 0) lst += 360;

    let ha = lst - raDeg; let rad = Math.PI / 180;
    let sinAlt = Math.sin(lat*rad)*Math.sin(decDeg*rad) + Math.cos(lat*rad)*Math.cos(decDeg*rad)*Math.cos(ha*rad);
    let alt = Math.asin(sinAlt) / rad;
    let cosA = (Math.sin(decDeg*rad) - Math.sin(alt*rad)*Math.sin(lat*rad)) / (Math.cos(alt*rad)*Math.cos(lat*rad));
    cosA = Math.max(-1, Math.min(1, cosA)); 
    let az = Math.acos(cosA) / rad;
    if (Math.sin(ha*rad) > 0) az = 360 - az;
    return { alt: parseFloat(alt.toFixed(1)), az: parseFloat(az.toFixed(1)) };
}

function getCardinalPoint(az) {
    const directions = ["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste", "Norte"];
    return directions[Math.round(az / 45)];
}

async function triggerAILocator() {
    const input = document.getElementById('aiInput').value.toUpperCase().replace(/\s+/g, '');
    const outputArea = document.getElementById('aiOutput');
    if(!input) { showToast("Ingrese un código de folio", "warning"); return; }
    
    outputArea.innerHTML = '<span class="ai-typing">> Obteniendo telemetría astrométrica...</span><br><span class="ai-typing">> Solicitando triangulación GPS...</span>';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => processTracking(input, position.coords.latitude, position.coords.longitude, outputArea),
            () => {
                outputArea.innerHTML += '<br><span style="color: #ff9900;">> Ubicación denegada. Usando observatorio base...</span>';
                processTracking(input, 40.4168, -3.7038, outputArea); 
            }
        );
    } else { processTracking(input, 40.4168, -3.7038, outputArea); }
}

async function processTracking(input, lat, lon, outputArea) {
    try {
        const docRef = await db.collection("estrellas").doc(input).get();
        if (docRef.exists) {
            const star = docRef.data();
            const raDeg = star.ra ? parseCoordToDeg(star.ra, true) : 0; 
            const decDeg = star.dec ? parseCoordToDeg(star.dec, false) : 0;
            const coords = getAltAz(lat, lon, raDeg, decDeg);
            let visibilityStr = coords.alt > 0 ? `<span style="color: #00ff66;">Visible sobre horizonte (${coords.alt}°)</span>` : `<span style="color: #ff3366;">Bajo el horizonte (${coords.alt}°)</span>`;
            let cardinal = getCardinalPoint(coords.az);

            outputArea.innerHTML = `
                <div style="color: #00ff66; margin-bottom: 15px; font-size: 1.1em;">> [ ÉXITO ] SEÑAL FIJADA</div>
                <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="margin-bottom: 5px;"><strong>Objetivo:</strong> <span style="color: #fff;">${star.name}</span></div>
                    <div style="margin-bottom: 10px;"><strong>Observador:</strong> Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                        <div>Elevación:<br><strong>${visibilityStr}</strong></div>
                        <div>Azimut Brújula:<br><strong>${coords.az}° (${cardinal})</strong></div>
                    </div>
                    <div class="radar-compass">
                        <div class="radar-needle" style="transform: translateX(-50%) rotate(${coords.az}deg);"></div>
                    </div>
                </div>
            `;
        } else { outputArea.innerHTML = '<span style="color: red;">> [ ERROR 404 ] Código no existe.</span>'; }
    } catch (error) { outputArea.innerHTML = '<span style="color: red;">> [ ERROR FATAL ] Servidor no responde.</span>'; }
}

async function loadAdminDashboard() {
    if(!isAdminActive) return;
    showSection('admin-panel');
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;"><div class="spinner" style="margin: 0 auto;"></div></td></tr>';
    try {
        const snapshot = await db.collection("estrellas").get();
        let rows = '';
        let docsArray = snapshot.docs.map(doc => doc.data()).reverse(); 
        docsArray.forEach(data => {
            let ship = data.shipping ? `<strong style="color:#fff">${data.shipping.name}</strong><br>${data.shipping.city}` : "<span style='color: var(--text-muted);'>Digital</span>";
            let priceTag = data.expectedAmount ? `<span style="color: #00ff66;">${data.expectedAmount} €</span>` : "-";
            let payPalTag = data.paypalTransactionId ? `<span style="font-family: monospace; font-size: 0.8rem; color: #aabfff;">${data.paypalTransactionId}</span>` : "-";
            rows += `<tr><td>${data.date}</td><td style="color: var(--accent-blue); font-weight: bold;">${data.id}</td><td><strong>${priceTag}</strong></td><td>${payPalTag}</td><td>${data.payerName || "S/N"}</td><td><strong>${data.name}</strong><br><span style="font-size:0.75rem; color:#888;">${data.pack}</span></td><td>${ship}</td></tr>`;
        });
        tbody.innerHTML = rows || '<tr><td colspan="7" style="text-align:center;">No hay ventas.</td></tr>';
    } catch (e) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error de BD.</td></tr>'; }
}
