  // --- GESTIÓN DE COOKIES ---
        document.addEventListener("DOMContentLoaded", () => {
            if (!localStorage.getItem("cookiesAccepted")) {
                document.getElementById("cookieBanner").style.display = "flex";
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
                Utilizamos cookies de terceros (como PayPal) estrictamente necesarias para procesar pagos seguros en la plataforma.
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

        // --- FIREBASE INICIALIZACIÓN (Solo lectura para Frontend) ---
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

      // --- FIX PDF (Encuadre Total 1 Sola Página) ---
function downloadPDF() {
    const originalElement = document.getElementById('pdf-content');
    const btn = document.getElementById('downloadPdfBtn');
    const starCode = document.getElementById('certId').innerText || "Documento";
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-expand fa-spin"></i> Encuadrando...';
    btn.style.pointerEvents = 'none';

    // 1. Creamos el clon con medidas fijas de papel A4
    const clone = originalElement.cloneNode(true);
    clone.style.width = "794px"; 
    clone.style.height = "1123px";
    clone.style.padding = "40px"; // Margen de cortesía para que el borde no toque el filo del papel
    clone.style.boxSizing = "border-box";
    clone.style.display = "flex";
    clone.style.flexDirection = "column";
    clone.style.justifyContent = "space-between";
    clone.style.backgroundColor = "white";
    clone.style.margin = "0";

    // 2. Contenedor temporal centrado e invisible
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100vw';
    wrapper.style.height = '100vh';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    wrapper.style.alignItems = 'flex-start';
    wrapper.style.zIndex = '-9999'; // Detrás de todo
    wrapper.style.overflow = 'hidden';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // 3. Disparo de cámara con corrección de scroll
    setTimeout(() => {
        const opt = {
            margin: 0,
            filename: `Certificado_NovaRegistry_${starCode}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                // ESTA LÍNEA ES LA QUE EVITA QUE SE CORTE EL PRINCIPIO:
                scrollY: -window.scrollY, 
                windowWidth: 794
            },
            jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
        };

        html2pdf().set(opt).from(clone).save().then(() => {
            document.body.removeChild(wrapper);
            btn.innerHTML = originalText;
            btn.style.pointerEvents = 'auto';
        }).catch(err => {
            console.error(err);
            if(document.body.contains(wrapper)) document.body.removeChild(wrapper);
            btn.innerHTML = originalText;
            btn.style.pointerEvents = 'auto';
        });
    }, 500); // Damos medio segundo para que el navegador asiente el diseño
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

        let checkoutPackage = "";
        let starNamePending = "";
        let paypalButtonsRendered = false;

        function openPayment(packageName) {
            let rawInput = document.getElementById('inputStarName').value;
            starNamePending = rawInput.replace(/[^\w\s\u00C0-\u024F]/gu, '').trim();
            
            if(starNamePending === "") { 
                alert("Introduzca un Nombre Oficial válido."); return; 
            }
            
            checkoutPackage = packageName;
            document.getElementById('legalConsent').checked = false; 

            const formEnvio = document.getElementById('shipping-form');
            formEnvio.style.display = (packageName.includes("Físico") || packageName.includes("VIP")) ? 'block' : 'none';

            document.getElementById('checkoutDesc').innerText = packageName;
            document.getElementById('paymentModal').style.display = 'flex';

            if (!paypalButtonsRendered) {
                paypal.Buttons({
                    style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'pay' },
                    
                    // 1. Pedimos a NUESTRO servidor que cree la orden segura
                    createOrder: async function(data, actions) { 
                        if(!document.getElementById('legalConsent').checked) {
                            alert("Por favor, marca la casilla de Términos de Venta para continuar.");
                            return actions.reject();
                        }
                        if (document.getElementById('shipping-form').style.display === 'block') {
                            const n = document.getElementById('shipName').value.trim();
                            const a = document.getElementById('shipAddress').value.trim();
                            const z = document.getElementById('shipZip').value.trim();
                            if(!n || !a || !z) {
                                alert("Rellene la dirección de envío.");
                                return actions.reject(); 
                            }
                        }

                        const respuesta = await fetch('/api/crear-orden', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ paqueteId: checkoutPackage })
                        });
                        const ordenSegura = await respuesta.json();
                        
                        if (!respuesta.ok) {
                            alert("Error de seguridad en la pasarela.");
                            throw new Error("Transacción bloqueada.");
                        }
                        return ordenSegura.id; 
                    },
                    
                    // 2. El usuario paga y capturamos el dinero
                    onApprove: async function(data, actions) {
                        const details = await actions.order.capture();
                        
                        // 3. Mostramos la pantalla de carga
                        const overlay = document.getElementById('processingOverlay');
                        overlay.style.display = 'flex';
                        closePaymentModal();

                        let shippingData = null;
                        if (document.getElementById('shipping-form').style.display === 'block') {
                            shippingData = {
                                name: document.getElementById('shipName').value.trim(),
                                address: document.getElementById('shipAddress').value.trim(),
                                city: document.getElementById('shipCity').value.trim(),
                                zip: document.getElementById('shipZip').value.trim(),
                                phone: document.getElementById('shipPhone').value.trim()
                            };
                        }

                        // 4. Pedimos a NUESTRO servidor que guarde en Firebase
                        const resFirebase = await fetch('/api/guardar-estrella', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                paqueteId: checkoutPackage,
                                starName: starNamePending,
                                payerName: details.payer.name.given_name,
                                paypalTransactionId: details.id,
                                shippingInfo: shippingData
                            })
                        });
                        const resultado = await resFirebase.json();

                        overlay.style.display = 'none';

                        if(resultado.success) {
                            alert(`¡COMPRA CONFIRMADA!\nCódigo: ${resultado.novaCode}\n\nGuarda este código NOVA para poder recuperar tu certificado.`);
                            showSection('mystar');
                            document.getElementById('myStarInput').value = resultado.novaCode;
                            loadMyStar();
                        } else {
                            alert("Error al contactar con el Registro Central.");
                        }
                    },
                    onError: function(err) { alert("Error al procesar PayPal."); }
                }).render('#paypal-button-container');
                paypalButtonsRendered = true;
            }
        }

        function closePaymentModal() { document.getElementById('paymentModal').style.display = 'none'; }

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
                    document.getElementById('certBarcode').innerText = `*${star.id.replace('-','')}*`;
                    document.getElementById('certLore').innerText = star.lore ? `"${star.lore}"` : "";
                    // GENERADOR DE CÓDIGO QR DINÁMICO
            const qrImage = document.getElementById('certQR');
            const urlEstrella = "https://www.novaregistry.net/?verify=" + star.id;
            qrImage.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(urlEstrella);
            qrImage.style.display = "block";
                } else { alert('Código no localizado en el registro oficial.'); }
            } catch (error) { alert("Fallo de conexión."); }
        }

        // --- FUNCIONES IA TRACKER ---
        function parseCoordToDeg(coordStr, isRA) {
            let match;
            if (isRA) { 
                match = coordStr.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
                if (!match) return 0;
                return (parseFloat(match[1]) + parseFloat(match[2])/60 + parseFloat(match[3])/3600) * 15;
            } else { 
                match = coordStr.match(/([+-]?\d+)°\s*(\d+)'\s*(\d+)/);
                if (!match) return 0;
                let sign = coordStr.includes('-') ? -1 : 1;
                return sign * (Math.abs(parseFloat(match[1])) + parseFloat(match[2])/60 + parseFloat(match[3])/3600);
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
                            
                            <!-- NUEVO RADAR AR -->
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
                    let ship = data.shipping ? `<strong style="color:#fff">${data.shipping.name}</strong><br>${data.shipping.city}` : "<span style='color: var(--text-muted);'>Digital</span>";
                    let priceTag = data.expectedAmount ? `<span style="color: #00ff66;">${data.expectedAmount} €</span>` : "-";
                    let payPalTag = data.paypalTransactionId ? `<span style="font-family: monospace; font-size: 0.8rem; color: #aabfff;">${data.paypalTransactionId}</span>` : "-";
                    
                    rows += `<tr><td>${data.date}</td><td style="color: var(--accent-blue); font-weight: bold;">${data.id}</td><td><strong>${priceTag}</strong></td><td>${payPalTag}</td><td>${data.payerName || "S/N"}</td><td><strong>${data.name}</strong><br><span style="font-size:0.75rem; color:#888;">${data.pack}</span></td><td>${ship}</td></tr>`;
                });
                tbody.innerHTML = rows || '<tr><td colspan="7" style="text-align:center;">No hay ventas.</td></tr>';
            } catch (e) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error de BD.</td></tr>'; }
        }
    
