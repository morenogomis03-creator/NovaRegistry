export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const { paqueteId } = req.body;
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

        if (!clientId || !secret) {
            return res.status(500).json({ error: 'Faltan claves de PayPal en Vercel' });
        }

        const auth = Buffer.from(clientId + ':' + secret).toString('base64');
        const responseToken = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!responseToken.ok) {
            // SI FALLA AQUÍ: Significa que tu PAYPAL_SECRET es incorrecto o es de Sandbox.
            return res.status(500).json({ error: 'PayPal rechazó tus credenciales secretas.' });
        }

        const { access_token } = await responseToken.json();

        const paypalResponse = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [{ amount: { currency_code: "EUR", value: precioReal.toFixed(2) } }]
            })
        });

        if (!paypalResponse.ok) {
            return res.status(500).json({ error: 'PayPal no pudo generar el cobro.' });
        }

        const orden = await paypalResponse.json();
        return res.status(200).json({ id: orden.id });

    } catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}
