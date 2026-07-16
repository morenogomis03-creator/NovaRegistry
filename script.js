// --- INICIALIZACIÓN, COOKIES Y FASE 1 (CRO) ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Gestión de Cookies
    if (!localStorage.getItem("cookiesAccepted")) {
        document.getElementById("cookieBanner").style.display = "flex";
    }

    // 2. FASE 1: LÓGICA DEL BUSCADOR (Micro-compromiso)
    const btnBuscar = document.getElementById('btn-buscar-estrella'); 
    if (btnBuscar) {
        btnBuscar.addEventListener('click', function(e) {
            const inputNombre = document.getElementById('nombre-estrella') || document.getElementById('inputStarName'); 
            
            if(inputNombre && inputNombre.value.trim() === '') {
                alert('Por favor, introduce el nombre del legado astronómico antes de continuar.');
                return;
            }

            e.preventDefault(); 

            const loader = document.getElementById('loader-estrella');
            if(loader) {
                this.style.display = 'none'; 
                loader.style.display = 'block'; 

                setTimeout(() => {
                    loader.innerHTML = '<p style="color: #00ff66; font-weight: bold; font-family: \'Montserrat\', sans-serif;">✨ ¡Sector espacial localizado y reservado temporalmente! Elige tu método de consagración abajo.</p>';
                }, 2500); 
            }
        });
    }

    // 3. FASE 1: PRUEBA SOCIAL (Notificaciones rotativas)
    const comprasRecientes = [
        "Estrella 'María y Juan' registrada (Hace 2h)",
        "Paquete Físico Premium asignado a 'Madrid' (Hace 12h)",
        "Estrella 'Legado Familiar' registrada (Hace 5h)",
        "Pack Supernova VIP reservado (Hace 1h)",
        "Estrella 'Abuelo Antonio' registrada (Hace 20 min)",
        "Paquete Físico Premium asignado a 'Valencia' (Hace 3h)"
    ];

    const toast = document.getElementById('toast-notificacion');

    function mostrarNotificacion() {
        if(!toast) return;
        const aleatorio = Math.floor(Math.random() * comprasRecientes.length);
        toast.innerHTML = `<strong>🌟 Nuevo Registro:</strong><br>${comprasRecientes[aleatorio]}`;
        
        toast.classList.add('mostrar');
        
        setTimeout(() => {
            toast.classList.remove('mostrar');
        }, 4500);
    }

    if(toast) {
        setTimeout(() => {
            mostrarNotificacion();
            setInterval(mostrarNotificacion, 28000);
        }, 8000); 
    }
});

function acceptCookies() {
    localStorage.setItem("cookiesAccepted", "true");
    document.getElementById("cookieBanner").style.display = "none";
}

const legalTexts = {
    'Aviso Legal': `
        <strong style="color: var(--gold-main);">1. Datos Identificativos</strong><br>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), le informamos que este sitio web es operado por TU NOMBRE/EMPRESA, con NIF/CIF TU_NIF, domicilio en TU_DIRECCIÓN. Contacto: TU_EMAIL.<br><br>
        <strong style="color: var(--gold-main);">2. Naturaleza del Servicio</strong><br>
        NovaRegistry ofrece un servicio de archivo astrométrico de carácter conmemorativo. Los nombres asignados a los cuerpos celestes a través de nuestra plataforma se archivan en nuestra base de datos privada. Este servicio <strong>NO</strong> cuenta con reconocimiento oficial por parte de la Unión Astronómica Internacional (IAU).
    `,
    'Política de Privacidad': `
        <strong style="color: var(--gold-main);">1. Responsable del Tratamiento</strong><br>
        En cumplimiento con el Reglamento (UE) 2016/679 (RGPD), le informamos que TU NOMBRE/EMPRESA es el responsable del tratamiento.<br><br>
        <strong style="color: var(--gold-main);">2. Cookies y Análisis</strong><br>
        Utilizamos cookies de terceros (como Stripe) estrictamente necesarias para procesar pagos seguros en la plataforma.
    `,
    'Términos y Condiciones': `
        <strong style="color: var(--gold-main);">1. Objeto y Desistimiento</strong><br>
        De acuerdo con el artículo 103 de la Ley General para la Defensa de los Consumidores y Usuarios, el derecho de desistimiento <strong>NO es aplicable</strong> a bienes confeccionados conforme a las especificaciones del consumidor (artículos personalizados). No se admiten devoluciones una vez adjudicado el certificado.
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
            html2canvas: { 
                scale: 2,           
                useCORS: true,      
                logging: false,
                letterRendering: true,
                scrollY: 0,         
                windowWidth: 794    
            },
            jsPDF: { 
                unit: 'px', 
                format: [794, 1123], 
                orientation: 'portrait',
                hotfixes: ['px_scaling'] 
            }
        };

        await html2pdf().set(options).from(clone).save();
        document.body.removeChild(container);
        btn.innerHTML = originalText;

    } catch (error) {
        console.error("Error crítico en PDF:", error);
        alert("Hubo un error al generar el archivo. Por favor, inténtelo de nuevo.");
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
    
    // CAMBIO EFECTUADO: Llevamos el scroll arriba del todo instantáneamente
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    if(sectionId === 'home') document.getElementById('link-home').classList.add('active-link');
    if(sectionId === 'firmamento') {
        document.getElementById('link-firm').classList.add('active-link');
        if(!canvasInitialized) initBackgroundSky();
    }
    if(sectionId === 'mystar') document.getElementById('link-mystar').classList.add('active-link');
    if(sectionId === 'ia-locator') document.getElementById('link-ia').classList.add('active-link');
    if(sectionId === 'admin-panel' && document.getElementById('link-admin')) document.getElementById('link-admin').classList.add('active-link');
}

// --- SISTEMA VR / PARALLAX ---
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

// === LÓGICA DE STRIPE (Sustituye a PayPal) ===
let checkoutPackage = "";
let starNamePending = "";

const STRIPE_LINKS = {
    'Estrella Digital': "https://buy.stripe.com/aFadR93lJeZz3Kv9zw14402",
    'Paquete Físico Premium': "https://buy.stripe.com/9B6fZhaOb2cN4Oz27414401",
    'Pack Supernova VIP': "https://buy.stripe.com/14AeVd1dB6t33Kv8vs14403"
};

function openPayment(packageName) {
    let rawInput = document.getElementById('inputStarName').value;
    starNamePending = rawInput.replace(/[^\w\s\u00C0-\u024F]/gu, '').trim();
    
    if(starNamePending === "") { 
        alert("Por favor, introduce el nombre oficial para la estrella."); 
        return; 
    }
    
    checkoutPackage = packageName;
    const legalCheckbox = document.getElementById('legalConsent');
    if (legalCheckbox) legalCheckbox.checked = false; 

    const formEnvio = document.getElementById('shipping-form');
    formEnvio.style.display = (packageName.includes("Herencia") || packageName.includes("Soberanía") || packageName.includes("Físico") || packageName.includes("VIP")) ? 'block' : 'none';

    document.getElementById('checkoutDesc').innerText = "Registro: " + packageName;
    document.getElementById('paymentModal').style.display = 'flex';

    const oldAdminBtn = document.getElementById('admin-bypass-btn');
    if (oldAdminBtn) oldAdminBtn.remove();

    // MODO ADMIN: Registro gratuito
    if (isAdminActive) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'admin-bypass-btn';
        adminBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> REGISTRO GRATUITO (ADMIN)';
        adminBtn.style = "width:100%; background:#2ecc71; color:black; padding:15px; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-bottom:20px; font-size:1rem; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);";
        
        const btnStripe = document.getElementById('btn-proceder-pago');
        btnStripe.parentNode.insertBefore(adminBtn, btnStripe);

        adminBtn.onclick = async () => {
            if(!document.getElementById('legalConsent').checked) {
                alert("Debes marcar la casilla de términos para proceder con el registro interno.");
                return;
            }
            if(confirm("¿Confirmar alta directa para '" + starNamePending + "'?")) {
                guardarRegistroEnBD(null); 
            }
        };
    }

    // BOTÓN STRIPE: Asignamos el evento click
    const btnStripe = document.getElementById('btn-proceder-pago');
    if (btnStripe) {
        btnStripe.onclick = () => procesarPagoStripe(packageName);
    }
}

function procesarPagoStripe(packageName) {
    if(!document.getElementById('legalConsent').checked) {
        alert("Por favor, acepta los términos de venta.");
        return;
    }

    const formEnvio = document.getElementById('shipping-form');
    let datosEnvio = null;
    
    // Validación de envío
    if (formEnvio.style.display === 'block') {
        const sName = document.getElementById('shipName').value.trim();
        const sAddress = document.getElementById('shipAddress').value.trim();
        if (!sName || !sAddress) {
            alert("Por favor, rellena los datos de envío completo.");
            return;
        }
        datosEnvio = {
            name: sName,
            address: sAddress,
            city: document.getElementById('shipCity').value,
            zip: document.getElementById('shipZip').value,
            phone: document.getElementById('shipPhone').value
        };
    }

    // Guardamos los datos en localStorage antes de ir a Stripe
    const datosPedido = {
        nombre: starNamePending,
        paquete: packageName,
        envio: datosEnvio,
        fecha: new Date().toISOString()
    };
    localStorage.setItem('temp_nova_order', JSON.stringify(datosPedido));

    // Redirigimos al enlace de pago real de Stripe
    window.location.href = STRIPE_LINKS[packageName];
}


// --- GESTIÓN DE GUARDADO EN BASE DE DATOS ---
async function guardarRegistroEnBD(pedidoStripe, stripeTransactionId = null) {
    const overlay = document.getElementById('processingOverlay');
    overlay.style.display = 'flex';
    document.getElementById('paymentModal').style.display = 'none';

    try {
        const newId = "NOVA-" + Math.floor(10000 + Math.random() * 90000);
        const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

        const mitologias = [
            "Conocida como el faro eterno, esta estrella ha guiado a exploradores a través de los siglos, representando la luz constante en el cosmos.",
            "Una joya radiante en el tejido cósmico que simboliza la sabiduría y la inmortalidad en las leyendas de antiguas civilizaciones.",
            "Dice la leyenda que esta estrella nació de un suspiro divino, destinada a brillar perpetuamente como guardiana de los sueños.",
            "Situada en las coordenadas sagradas, es el símbolo de la esperanza para aquellos que buscan su destino bajo el manto de la noche.",
            "Una gigante de luz pura cuya energía primordial ha moldeado el destino de las constelaciones desde el inicio de los tiempos."
        ];
        const loreSeleccionado = mitologias[Math.floor(Math.random() * mitologias.length)];

        // Determinamos de dónde vienen los datos (Stripe vs Admin)
        let finalName = pedidoStripe ? pedidoStripe.nombre : starNamePending.toUpperCase();
        let finalPack = pedidoStripe ? pedidoStripe.paquete : checkoutPackage;
        let finalEnvio = pedidoStripe ? pedidoStripe.envio : null;

        // Si es Admin (sin pedidoStripe), sacamos los datos de envío directamente de la pantalla
        if (!pedidoStripe) {
            const formEnvio = document.getElementById('shipping-form');
            if (formEnvio.style.display === 'block') {
                finalEnvio = {
                    name: document.getElementById('shipName').value,
                    address: document.getElementById('shipAddress').value,
                    city: document.getElementById('shipCity').value,
                    zip: document.getElementById('shipZip').value,
                    phone: document.getElementById('shipPhone').value
                };
            }
        }

        const starData = {
            id: newId,
            name: finalName.toUpperCase(),
            date: fecha,
            pack: finalPack,
            official: "HD " + Math.floor(Math.random() * 200000),
            ra: (Math.floor(Math.random() * 24)) + "h " + (Math.floor(Math.random() * 60)) + "m " + (Math.floor(Math.random() * 60)) + "s",
            dec: (Math.random() > 0.5 ? "+" : "-") + Math.floor(Math.random() * 90) + "° " + Math.floor(Math.random() * 60) + "'",
            distance: (Math.floor(Math.random() * 1000) + 10) + " A.L.",
            spectral: "A0 V",
            temp: (Math.floor(Math.random() * 5000) + 5000) + " K",
            appMag: (Math.random() * 5 + 1).toFixed(2),
            lum: Math.floor(Math.random() * 100) + " Soles",
            lore: loreSeleccionado,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            shippingInfo: finalEnvio
        };

        if (pedidoStripe) {
            starData.payerName = finalEnvio ? finalEnvio.name : "Cliente Online";
            starData.stripeTransactionId = stripeTransactionId;
            const precios = { 'Estrella Digital': '20.00', 'Paquete Físico Premium': '40.00', 'Pack Supernova VIP': '60.00' };
            starData.expectedAmount = precios[finalPack] || "20.00";
        } else {
            starData.payerName = "Admin";
            starData.expectedAmount = "0.00";
        }

        // Guardamos en Firebase
        await db.collection("estrellas").doc(newId).set(starData);

        overlay.style.display = 'none';
        
        // Limpiamos formulario
        document.getElementById('shipName').value = '';
        document.getElementById('shipAddress').value = '';
        document.getElementById('shipCity').value = '';
        document.getElementById('shipZip').value = '';
        document.getElementById('shipPhone').value = '';

        // Cargamos el certificado en pantalla
        document.getElementById('myStarInput').value = newId;
        loadMyStar(); 

    } catch (e) {
        overlay.style.display = 'none';
        console.error("Error al guardar:", e);
        alert("Error al conectar con la base de datos: " + e.message);
    }
}

// === FUNCIÓN DEL BUSCADOR (IA TRACKER) ===
async function loadMyStar() {
    const inputField = document.getElementById('myStarInput');
    if(!inputField) return;
    
    const input = inputField.value.toUpperCase().replace(/\s+/g, '');
    if(!input) return alert("Introduce un código NOVA.");

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
            qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent("https://novaregistry.net/?verify=" + star.id)}`;

        } else {
            alert('Código no encontrado.');
        }
    } catch (error) {
        console.error("Error buscando estrella:", error);
        alert("Fallo al conectar con la base de datos.");
    }
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
    if(!input) { outputArea.innerHTML = '<span style="color: red;">> ERROR: Ingrese un código de folio.</span>'; return; }
    outputArea.innerHTML = '<span class="ai-typing">> Obteniendo telemetría astrométrica...</span><br><span class="ai-typing">> Solicitando triangulación GPS al dispositivo...</span>';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => processTracking(input, position.coords.latitude, position.coords.longitude, outputArea),
            () => {
                outputArea.innerHTML += '<br><span style="color: #ff9900;">> Ubicación denegada. Usando observatorio base (Lat: 40.41, Lon: -3.70)...</span>';
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
            let visibilityStr = coords.alt > 0 ? `<span style="color: #00ff66;">Visible sobre el horizonte (${coords.alt}°)</span>` : `<span style="color: #ff3366;">Bajo el horizonte (${coords.alt}°)</span>`;
            let cardinal = getCardinalPoint(coords.az);

            outputArea.innerHTML = `
                <div style="color: #00ff66; margin-bottom: 15px; font-size: 1.1em;">> [ ÉXITO ] SEÑAL TELEMÉTRICA FIJADA</div>
                <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 15px;">
                    <div style="margin-bottom: 5px;"><strong>Estrella Objetivo:</strong> <span style="color: #fff;">${star.name}</span></div>
                    <div style="margin-bottom: 10px;"><strong>Observador Local:</strong> Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}</div>
                    <div style="color: var(--gold-main);"><strong>Datos en Tiempo Real:</strong></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 5px; margin-bottom: 15px;">
                        <div>Elevación:<br><strong>${visibilityStr}</strong></div>
                        <div>Azimut Brújula:<br><strong>${coords.az}° (${cardinal})</strong></div>
                    </div>
                    
                    <div class="radar-compass">
                        <div class="radar-needle" style="transform: translateX(-50%) rotate(${coords.az}deg);"></div>
                    </div>
                    
                </div>
                <div style="color: var(--accent-blue); margin-top: 15px; font-size: 0.9em;">
                    <strong>> 🛰️ ASISTENTE DE AVISTAMIENTO:</strong><br> 
                    ${coords.alt > 0 ? `Abre la brújula de tu móvil y apunta hacia el <strong>${cardinal} (${coords.az}°)</strong>.` : `Tu estrella se encuentra oculta bajo la Tierra en este momento debido a la rotación.`}
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
            let ship = data.shippingInfo ? `<strong style="color:#fff">${data.shippingInfo.name}</strong><br>${data.shippingInfo.city}` : "<span style='color: var(--text-muted);'>Digital</span>";
            let priceTag = data.expectedAmount ? `<span style="color: #00ff66;">${data.expectedAmount} €</span>` : "-";
            // Cambiado para mostrar el ID de Stripe en lugar de PayPal
            let stripeTag = data.stripeTransactionId ? `<span style="font-family: monospace; font-size: 0.8rem; color: #aabfff;">${data.stripeTransactionId}</span>` : "-";
            
            rows += `<tr><td>${data.date}</td><td style="color: var(--accent-blue); font-weight: bold;">${data.id}</td><td><strong>${priceTag}</strong></td><td>${stripeTag}</td><td>${data.payerName || "S/N"}</td><td><strong>${data.name}</strong><br><span style="font-size:0.75rem; color:#888;">${data.pack}</span></td><td>${ship}</td></tr>`;
        });
        tbody.innerHTML = rows || '<tr><td colspan="7" style="text-align:center;">No hay ventas.</td></tr>';
    } catch (e) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error de BD.</td></tr>'; }
}

// --- FUNCIÓN MATEMÁTICA INTERNA PARA PARSEO DE COORDENADAS ---
function parseCoordToDeg(coordStr, isRA) {
    if (!coordStr) return 0;
    const matches = coordStr.match(/[-+]?\d+(\.\d+)?/g);
    if (!matches || matches.length === 0) return 0;

    const val1 = parseFloat(matches[0]) || 0;
    const val2 = parseFloat(matches[1]) || 0;
    const val3 = parseFloat(matches[2]) || 0;

    if (isRA) {
        return (val1 + val2 / 60 + val3 / 3600) * 15;
    } else {
        const sign = coordStr.trim().startsWith('-') ? -1 : 1;
        const absoluteDegrees = Math.abs(val1) + val2 / 60 + val3 / 3600;
        return absoluteDegrees * sign;
    }
}

/* =========================================
   FASE 2: TRÁFICO VIRAL Y RETORNO DE STRIPE
========================================= */
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyCode = urlParams.get('verify');
    const pagoStatus = urlParams.get('pago');
    
    // 1. Lógica de lectura de QR
    if (verifyCode) {
        showSection('mystar');
        const inputVerificar = document.getElementById('myStarInput');
        if (inputVerificar) {
            inputVerificar.value = verifyCode;
            setTimeout(() => { loadMyStar(); }, 600);
        }
        window.history.replaceState({}, document.title, "/");
    }

    // 2. Lógica de retorno exitoso tras pagar en Stripe
    if (pagoStatus && pagoStatus.startsWith('ok_')) {
        const datosGuardados = localStorage.getItem('temp_nova_order');
        
        if (datosGuardados) {
            const pedido = JSON.parse(datosGuardados);
            
            // Generamos un ID simulado de transacción para tu panel de administrador
            const transaccionId = "pi_" + Math.random().toString(36).substr(2, 14);

            // Guardamos todo en Firebase
            await guardarRegistroEnBD(pedido, transaccionId);

            // Limpiamos los datos temporales y la URL
            localStorage.removeItem('temp_nova_order');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
});
