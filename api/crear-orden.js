export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const { paqueteId } = req.body;

    // LA BÓVEDA DE PRECIOS IMPOSIBLE DE HACKEAR
    const catalogoPrecios = {
        'Estrella Digital': 30.00,
        'Paquete Físico Premium': 60.00,
        'Pack Supernova VIP': 90.00
    };

    const precioReal = catalogoPrecios[paqueteId];
    if (!precioReal) return res.status(400).json({ error: 'Paquete inválido' });

    try {
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const secret = process.env.PAYPAL_SECRET;
        
        const auth = Buffer.from(clientId + ':' + secret).toString('base64');
        const responseToken = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const { access_token } = await responseToken.json();

        const paypalResponse = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [{ amount: { currency_code: "EUR", value: precioReal.toFixed(2) } }]
            })
        });

        const orden = await paypalResponse.json();
        return res.status(200).json({ id: orden.id });
    } catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
