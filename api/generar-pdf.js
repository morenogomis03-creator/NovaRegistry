import { jsPDF } from "jspdf";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');

    const { id, name, date, starDetails } = req.body;

    try {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        // --- DISEÑO DEL CERTIFICADO (Backend) ---
        // Color de fondo crema suave
        doc.setFillColor(250, 249, 246);
        doc.rect(0, 0, 210, 297, 'F');

        // Bordes elegantes
        doc.setLineWidth(1);
        doc.setDrawColor(34, 34, 34);
        doc.rect(5, 5, 200, 287); // Borde exterior
        doc.setLineWidth(0.5);
        doc.rect(7, 7, 196, 283); // Borde interior

        // Título Principal
        doc.setTextColor(17, 17, 17);
        doc.setFont("times", "bold");
        doc.setFontSize(35);
        doc.text("NOVA REGISTRY", 105, 40, { align: "center" });

        doc.setFontSize(14);
        doc.setFont("times", "normal");
        doc.text("CERTIFICADO DE ADJUDICACIÓN PATRIMONIAL", 105, 50, { align: "center" });

        // Línea divisoria
        doc.setLineWidth(0.5);
        doc.line(40, 55, 170, 55);

        // Cuerpo del texto
        doc.setFontSize(16);
        doc.text("Se certifica que el cuerpo celeste ha sido registrado bajo el nombre:", 105, 80, { align: "center" });

        // Nombre de la Estrella
        doc.setTextColor(184, 134, 11); // Color Dorado/Bronce
        doc.setFontSize(32);
        doc.setFont("times", "bolditalic");
        doc.text(name.toUpperCase(), 105, 100, { align: "center" });

        // Detalles Técnicos
        doc.setTextColor(34, 34, 34);
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.text(`ID de Registro: ${id}`, 105, 120, { align: "center" });
        doc.text(`Fecha de Registro: ${date}`, 105, 128, { align: "center" });

        // Cuadro de Coordenadas
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(255, 255, 255);
        doc.rect(30, 140, 150, 40, 'FD');
        
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.text("DATOS ASTROMÉTRICOS OFICIALES", 105, 148, { align: "center" });
        doc.text(`Ascensión Recta: ${starDetails?.ra || "--"}`, 105, 158, { align: "center" });
        doc.text(`Declinación: ${starDetails?.dec || "--"}`, 105, 165, { align: "center" });
        doc.text(`Magnitud: ${starDetails?.mag || "--"}`, 105, 172, { align: "center" });

        // Sello y Firma
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("SELLO DE AUTENTICIDAD DIGITAL", 155, 230, { align: "center" });
        doc.circle(155, 250, 15, 'S'); // Representación del sello
        doc.text("NOVA", 155, 252, { align: "center" });

        // Mensaje legal
        doc.setFontSize(8);
        doc.text("Este documento representa un registro privado con fines conmemorativos.", 105, 280, { align: "center" });

        // Enviar el PDF como respuesta
        const pdfOutput = doc.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificado_${id}.pdf`);
        return res.status(200).send(Buffer.from(pdfOutput));

    } catch (error) {
        console.error("Error generando PDF:", error);
        return res.status(500).send("Error al fabricar el certificado.");
    }
}
