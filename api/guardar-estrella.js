import admin from 'firebase-admin';

// Inicializamos Firebase con tu Llave Maestra secreta de Vercel
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { paqueteId, starName, payerName, paypalTransactionId, shippingInfo } = req.body;
    
    // Generamos el código oficial en el servidor
    let newCode = 'NOVA-' + Math.floor(10000 + Math.random() * 90000);

    const starData = {
        id: newCode, 
        name: starName.toUpperCase(),
        date: new Date().toLocaleDateString('es-ES'),
        pack: paqueteId,
        payerName: payerName || "Cliente",
        paypalTransactionId: paypalTransactionId || "PENDIENTE",
        shipping: shippingInfo || null // Guardamos los datos de envío si existen
    };

    try {
        // Ignoramos el "allow create: if false" usando la llave maestra
        await db.collection("estrellas").doc(newCode).set(starData);
        return res.status(200).json({ success: true, novaCode: newCode });
    } catch (error) {
        return res.status(500).json({ error: 'Fallo al guardar en base de datos' });
    }
}