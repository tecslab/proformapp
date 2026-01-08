import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Helper for number to words (Simplified Spanish)
function numberToWordsEs(number: number): string {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
    const diez_veinte = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

    function convertGroup(n: number): string {
        let output = ''
        if (n === 100) return 'CIEN'

        if (n >= 100) {
            output += centenas[Math.floor(n / 100)] + ' '
            n %= 100
        }

        if (n >= 10 && n <= 19) {
            output += diez_veinte[n - 10]
            return output
        } else if (n >= 20) {
            output += decenas[Math.floor(n / 10)]
            n %= 10
            if (n > 0) output += ' Y '
        }

        if (n > 0) {
            output += unidades[n]
        }
        return output
    }

    const integerPart = Math.floor(number)
    const decimalPart = Math.round((number - integerPart) * 100)

    let words = ''

    if (integerPart === 0) words = 'CERO'
    else if (integerPart >= 1000000) {
        const millions = Math.floor(integerPart / 1000000)
        const remainder = integerPart % 1000000
        if (millions === 1) words += 'UN MILLÓN '
        else words += convertGroup(millions) + ' MILLONES '

        if (remainder > 0) {
            if (remainder >= 1000) {
                const thousands = Math.floor(remainder / 1000)
                const rest = remainder % 1000
                if (thousands === 1) words += 'MIL '
                else words += convertGroup(thousands) + ' MIL '
                if (rest > 0) words += convertGroup(rest)
            } else {
                words += convertGroup(remainder)
            }
        }
    } else if (integerPart >= 1000) {
        const thousands = Math.floor(integerPart / 1000)
        const rest = integerPart % 1000
        if (thousands === 1) words += 'MIL '
        else words += convertGroup(thousands) + ' MIL '
        if (rest > 0) words += convertGroup(rest)
    } else {
        words += convertGroup(integerPart)
    }

    return `${words.trim()} DÓLARES AMERICANOS CON ${decimalPart}/100 CENTAVOS`
}

export const generateProformaPDF = async (proforma: any) => {
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
    doc.setFont("helvetica", "normal"); doc.text(`${client.first_name} ${client.last_name}`, col2 + 2, y + 5)
    doc.setFont("helvetica", "bold"); doc.text("Ruc", col3 + 1, y + 5)
    doc.setFont("helvetica", "normal"); doc.text(client.cedula_ruc || '', col4 + 2, y + 5)

    // Row 3
    y += rowH
    doc.setFont("helvetica", "bold"); doc.text("Dirección", col1 + 1, y + 5)
    doc.setFont("helvetica", "normal");
    const address = client.city ? `${client.city}` : (client.address || '-')
    doc.text(address, col2 + 2, y + 5)

    doc.setFont("helvetica", "bold"); doc.text("correo", col3 + 1, y + 5)
    doc.setFont("helvetica", "normal"); doc.text(client.email || '-', col4 + 2, y + 5)

    // --- ITEMS TABLE ---
    const tableData = items.map((item: any) => {
        const earned = item.unit_cost * (item.percentage_gain / 100)
        const unitPrice = item.unit_cost + earned
        const lineTotal = unitPrice * item.quantity
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
    let finalY = (doc as any).lastAutoTable.finalY + 5

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
    let footerY = (doc as any).lastAutoTable.finalY + 10

    // Amount convert
    const totalRounded = Math.round(proforma.total * 100) / 100
    const amountInWords = numberToWordsEs(totalRounded).toUpperCase()

    doc.setFillColor(217, 217, 217) // #d9d9d9
    doc.rect(14, footerY, 100, 8, 'F')
    doc.setFontSize(8)
    doc.text(`SON: ${amountInWords}`, 16, footerY + 5)

    footerY += 15
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
    if (proforma.observations) {
        doc.text(proforma.observations, 20, footerY + 13)
    }

    footerY += 20
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
