import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { numberToWordsEs, calculateItemDetails } from './calculations'

export const generateProformaPDF = async (proforma: {
    clients: {
        first_name?: string;
        last_name?: string;
        cedula_ruc?: string;
        phone?: string;
        email?: string;
        city?: string;
        address?: string;
    } | null;
    items: {
        unit_cost: number | string;
        percentage_gain: number | string;
        quantity: number | string;
        description: string;
        unit: string;
        line_total?: number | string;
    }[];
    proforma_number: number | string;
    date: string | number | Date;
    subtotal: number;
    iva_percentage: number;
    iva_amount: number;
    total: number;
    delivery_days: string;
    payment_methods: string;
    observations: string;
}) => {
    const doc = new jsPDF()
    const client = proforma.clients || {}
    const items = proforma.items || []

    // Fonts
    doc.setFont("helvetica")

    // --- HEADER ---
    // Logo
    // We assume the logo is at /logo_armonint.jpg. jsPDF needs base64 or Image element.
    // We'll create an image element to load it.
    const logoUrl = window.location.origin + '/logo_armonint.jpg'
    try {
        const img = new Image()
        img.src = logoUrl
        await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
        })
        doc.addImage(img, 'JPEG', 20, 8, 18, 18) // x, y, w, h
    } catch (e) {
        console.warn('Logo load failed', e)
        doc.setFontSize(10)
        doc.text("ARMONINT", 20, 12)
    }

    // Title
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`PROFORMA 00- ${String(proforma.proforma_number).padStart(4, '0')}`, 85, 20)

    // Professional
    doc.setFontSize(10)
    doc.text("Dis. Verónica Cedillo", 150, 15)

    // ID with Highlight
    doc.setTextColor(0, 0, 0)
    doc.text("0105706444", 152, 20)

    // Header Border
    doc.setDrawColor(0)
    doc.rect(14, 8, 182, 20) // Main box
    //doc.line(50, 8, 50, 38) // Vertical 1
    doc.line(140, 8, 140, 28) // Vertical 2

    // --- CLIENT INFO GRID ---
    let y = 28
    const rowH = 7
    const col1 = 14
    const col2 = 35
    const col3 = 110
    const col4 = 130

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")

    const formattedDate = format(new Date(proforma.date), 'dd/MM/yyyy', { locale: es })

    // Borders for Grid
    doc.rect(14, y, 182, rowH * 3)
    doc.line(14, y + rowH, 196, y + rowH)
    doc.line(14, y + rowH * 2, 196, y + rowH * 2)

    // Verticals for labels
    doc.line(col2, y, col2, y + rowH * 3) // After label 1
    doc.line(col3, y, col3, y + rowH * 3) // Before label 2
    doc.line(col4, y, col4, y + rowH * 3) // After label 2

    // Row 1
    doc.setFont("helvetica", "bold"); doc.text("Fecha", col1 + 1, y + 5)
    doc.setFont("helvetica", "normal"); doc.text(formattedDate, col2 + 2, y + 5)
    doc.setFont("helvetica", "bold"); doc.text("Telefono", col3 + 1, y + 5)
    doc.setFont("helvetica", "normal"); doc.text(client.phone || '-', col4 + 2, y + 5)

    // Row 2
    y += rowH
    doc.setFont("helvetica", "bold"); doc.text("Cliente", col1 + 1, y + 5)
    if (((client.first_name || '') + (client.last_name || '')).length > 30) {
        doc.setFontSize(7)
    }
    doc.setFont("helvetica", "normal"); doc.text(`${client.first_name || ''} ${client.last_name || ''}`, col2 + 2, y + 5)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold"); doc.text("Ruc", col3 + 1, y + 5)
    doc.setFont("helvetica", "normal"); doc.text(client.cedula_ruc || '', col4 + 2, y + 5)

    // Row 3
    y += rowH
    doc.setFont("helvetica", "bold"); doc.text("Dirección", col1 + 1, y + 5)
    if (((client.city || '') + (client.address || '')).length > 30) {
        doc.setFontSize(7)
    }
    doc.setFont("helvetica", "normal");
    const address = client.city ? `${client.city}` : (client.address || '-')
    doc.text(address, col2 + 2, y + 5)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold"); doc.text("correo", col3 + 1, y + 5)
    doc.setFont("helvetica", "normal"); doc.text(client.email || '-', col4 + 2, y + 5)

    // --- ITEMS TABLE ---
    const tableData = items.map((item) => {
        const { unitPrice, lineTotal } = calculateItemDetails(Number(item.unit_cost), Number(item.percentage_gain), Number(item.quantity))
        return [
            item.description,
            item.unit,
            item.quantity,
            unitPrice.toFixed(2),
            lineTotal.toFixed(2)
        ]
    })

    autoTable(doc, {
        startY: y + 10,
        head: [['DESCRIPCIÓN', 'UNIDAD', 'CANTIDAD', 'PRECIO UNIT', 'TOTAL']],
        body: tableData,
        theme: 'plain',
        styles: {
            fontSize: 9,
            cellPadding: 2,
            lineColor: 0,
            lineWidth: 0.1,
            textColor: 0
        },
        headStyles: {
            fillColor: [180, 198, 231], // #b4c6e7
            fontSize: 7,
            textColor: 0,
            fontStyle: 'bold',
            halign: 'center',
            lineColor: 0,
            lineWidth: 0.1
        },
        columnStyles: {
            0: { cellWidth: 114 }, // Desc
            1: { cellWidth: 14, halign: 'center' }, // Unit
            2: { cellWidth: 17, halign: 'center' }, // Qty
            3: { cellWidth: 21, halign: 'right' }, // Price
            4: { cellWidth: 16, halign: 'right' }  // Total
        },
        margin: { left: 14, right: 14 }
    })

    // --- TOTALS & FOOTER ---
    let finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5

    // Totals Table (Right side)
    const totalsX = 120
    const totalsW = 76
    const totalsRowH = 7

    doc.setLineWidth(0.1)
    doc.setDrawColor(0)

    // Subtotal
    doc.rect(totalsX, finalY, totalsW, totalsRowH)
    doc.line(totalsX + 38, finalY, totalsX + 38, finalY + totalsRowH) // Mid split
    doc.setFont("helvetica", "normal")
    doc.text("SUBTOTAL", totalsX + 2, finalY + 5)
    doc.text(proforma.subtotal.toFixed(2), totalsX + 74, finalY + 5, { align: 'right' })

    // IVA
    finalY += totalsRowH
    doc.rect(totalsX, finalY, totalsW, totalsRowH)
    doc.line(totalsX + 38, finalY, totalsX + 38, finalY + totalsRowH)
    doc.text(`IVA ${proforma.iva_percentage}%`, totalsX + 2, finalY + 5)
    doc.text(proforma.iva_amount.toFixed(2), totalsX + 74, finalY + 5, { align: 'right' })

    // Total con IVA
    finalY += totalsRowH
    doc.rect(totalsX, finalY, totalsW, totalsRowH)
    doc.line(totalsX + 38, finalY, totalsX + 38, finalY + totalsRowH)
    doc.text("TOTAL CON IVA", totalsX + 2, finalY + 5)
    doc.text(proforma.total.toFixed(2), totalsX + 74, finalY + 5, { align: 'right' })

    // Total a Pagar (Dark)
    finalY += totalsRowH
    doc.setFillColor(128, 128, 128)
    doc.rect(totalsX, finalY, totalsW, totalsRowH, 'F')
    doc.rect(totalsX, finalY, totalsW, totalsRowH, 'S') // Border
    doc.line(totalsX + 38, finalY, totalsX + 38, finalY + totalsRowH)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("TOTAL A PAGAR", totalsX + 2, finalY + 5)
    doc.text(proforma.total.toFixed(2), totalsX + 74, finalY + 5, { align: 'right' })
    doc.setTextColor(0, 0, 0)

    // Left Side Footer
    // Reset Y to top of totals section
    let footerY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // Amount convert
    const totalRounded = Math.round(proforma.total * 100) / 100
    const amountInWords = numberToWordsEs(totalRounded).toUpperCase()

    doc.setFillColor(217, 217, 217) // #d9d9d9
    doc.setFontSize(8)
    const splitAmount = doc.splitTextToSize(`SON: ${amountInWords}`, 95)
    const boxHeight = splitAmount.length > 1 ? 8 + (splitAmount.length - 1) * 5 : 8

    doc.rect(14, footerY, 100, boxHeight, 'F')
    doc.text(splitAmount, 16, footerY + 5)

    footerY += boxHeight + 7
    doc.setFont("helvetica", "bold")
    doc.text("PLAZO DE ENTREGA APROXIMADO:", 14, footerY)
    doc.setFont("helvetica", "normal")
    doc.text(`${proforma.delivery_days || '15'} DIAS LABORABLES`, 20, footerY + 5)

    footerY += 12
    doc.setFont("helvetica", "bold")
    doc.text("OBSERVACIONES", 14, footerY)
    doc.setFont("helvetica", "normal")
    doc.text("PRECIOS INCLUYEN IVA", 20, footerY + 5)
    doc.text("PLAZO DE ENTREGA FIJO SI NO SE REALIZAN CAMBIOS", 20, footerY + 9)

    let extraObsHeight = 0
    if (proforma.observations) {
        const splitObs = doc.splitTextToSize(proforma.observations, 160)
        doc.text(splitObs, 20, footerY + 13)
        // Approximate height increase: (lines - 1) * line_height_approx
        if (splitObs.length > 1) {
            extraObsHeight = (splitObs.length - 1) * 3.5
        }
    }

    footerY += 20 + extraObsHeight
    doc.setFont("helvetica", "bold")
    doc.text("FORMAS DE PAGO", 14, footerY)
    doc.setFont("helvetica", "normal")
    doc.text(proforma.payment_methods || '60% Para Iniciar 40% Contra-entrega', 20, footerY + 5)

    footerY += 20
    doc.text("ATENTAMENTE", 20, footerY)
    doc.setFont("helvetica", "bold")
    doc.text("DIS. VERÓNICA CEDILLO", 20, footerY + 5)

    // Save
    doc.save(`Proforma-${String(proforma.proforma_number).padStart(4, '0')}.pdf`)
}
