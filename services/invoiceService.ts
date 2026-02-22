
import { Order, AppConfig, UnitType } from "../types";
import { jsPDF } from "jspdf";

/**
 * Generates a professional PDF invoice, quote, or agreement.
 * @param order The order data
 * @param config App configuration
 * @param type 'INVOICE' | 'QUOTE' | 'ESTIMATE' | 'ORDER_AGREEMENT'
 * @returns Promise<string> The base64 Data URI of the generated PDF
 */
export const generateInvoicePDF = async (order: Order, config: AppConfig, type: 'INVOICE' | 'QUOTE' | 'ESTIMATE' | 'ORDER_AGREEMENT' = 'INVOICE'): Promise<string> => {
  try {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    // --- Helper: Draw Header ---
    const drawHeader = (doc: any) => {
        const headerHeight = 40;
        doc.setFillColor(244, 211, 0); // Meat Depot Yellow
        doc.rect(0, 0, 210, headerHeight, 'F');
        
        let hasLogo = false;
        const logoToUse = config.invoiceLogoUrl || config.logoUrl;
        
        // For Agreement or Quote, center the logo. For Invoice, keep left.
        const isCenteredLogo = type === 'QUOTE' || type === 'ESTIMATE' || type === 'ORDER_AGREEMENT';

        if (logoToUse) {
            try {
                if (isCenteredLogo) {
                    const logoSize = 36;
                    const xPos = (210 - logoSize) / 2;
                    doc.addImage(logoToUse, 'PNG', xPos, (headerHeight - logoSize) / 2, logoSize, logoSize, undefined, 'FAST');
                } else {
                    doc.addImage(logoToUse, 'PNG', margin, 5, 25, 25, undefined, 'FAST');
                }
                hasLogo = true;
            } catch (e) {
                console.warn("Could not embed logo image", e);
            }
        }

        if (!hasLogo) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(0, 0, 0);
            doc.text(config.businessDetails?.companyName || "MEAT DEPOT", margin, 25);
        }
    };

    drawHeader(doc);

    // --- LOGIC SPLIT: AGREEMENT VS FINANCIAL DOC ---
    
    if (type === 'ORDER_AGREEMENT') {
        // --- ORDER AGREEMENT LAYOUT ---
        
        // Title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("ORDER AGREEMENT", margin, 60);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Reference: Order #${order.id}`, margin, 68);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 74);
        doc.text(`Customer: ${order.customerName}`, margin, 80);

        // Agreement Terms
        doc.setFontSize(11);
        doc.text("I, the undersigned, hereby acknowledge and accept the following:", margin, 95);

        const terms = [
            "1. I accept the items, quantities, and pricing listed in the associated Quotation.",
            "",
            "2. I understand that for weighted items (such as dry-aged steaks, biltong, or bulk packs) where specific cuts are required, the actual final weight may vary slightly, resulting in a minor adjustment to the final total price.",
            "",
            "3. I agree to pay the final calculated total upon receipt of the tax invoice.",
            "",
            "4. I confirm that the delivery/collection details provided are correct."
        ];

        let termY = 110;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        
        terms.forEach(line => {
            const splitLine = doc.splitTextToSize(line, 170);
            doc.text(splitLine, margin, termY);
            termY += (splitLine.length * 6) + 2;
        });

        // Sign-off Area
        const signY = 200;
        
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);

        // Name Line
        doc.text("Client Name (Print):", margin, signY);
        doc.line(margin + 40, signY, margin + 120, signY);

        // Signature Line
        doc.text("Signature:", margin, signY + 30);
        doc.line(margin + 40, signY + 30, margin + 120, signY + 30);

        // Date Line
        doc.text("Date:", margin, signY + 60);
        doc.line(margin + 40, signY + 60, margin + 120, signY + 60);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Please sign and return this page to confirm your order.", 105, 280, { align: 'center' });

    } else {
        // --- INVOICE / QUOTE / ESTIMATE LAYOUT ---

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(type, 190, 25, { align: 'right' });
        doc.setFont("helvetica", "normal");
        doc.text(`#${order.id}`, 190, 31, { align: 'right' });

        y = 55;

        // --- Company & Client Info ---
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("FROM:", margin, y);
        doc.text("TO:", 110, y);
        
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        
        const details = config.businessDetails || {
            companyName: "Meat Depot Gqeberha",
            addressLine1: "63 Clarence Road, Westering",
            addressLine2: "Gqeberha, RSA",
            contactNumber: "844012488038318",
            email: "admin@meatdepot.co.za",
            bankingDetails: "",
            invoiceFooterText: ""
        };

        doc.text([
          details.companyName,
          details.addressLine1,
          details.addressLine2,
          `Tel: ${details.contactNumber}`,
          details.email
        ], margin, y);
        
        doc.text([
          order.customerName,
          order.deliveryType === 'DELIVERY' ? (order.deliveryAddress || "Delivery Requested") : (order.isManual ? "Walk-in / Counter" : "Collection In-Store"),
          "Gqeberha, South Africa",
          `Date: ${new Date(order.createdAt).toLocaleDateString()}`
        ], 110, y);

        y += 40;

        // --- Table Header ---
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, 170, 10, 'F');
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        
        doc.text("Description", margin + 5, y + 7);
        doc.text("Qty / Weight", margin + 85, y + 7);
        doc.text("Unit Price", margin + 115, y + 7);
        doc.text("Total", margin + 150, y + 7);

        y += 18;

        // --- Items ---
        doc.setFont("helvetica", "normal");
        order.items.forEach((item) => {
          const isKg = item.product.unit === UnitType.KG;
          
          let desc = item.product.name;
          if (item.selectedOptions && item.selectedOptions.length > 0) {
              desc += ` [${item.selectedOptions.join(', ')}]`;
          }

          const price = item.product.price;
          const itemTotal = isKg 
            ? (price / 1000) * (item.weight || 0) * item.quantity 
            : price * item.quantity;

          let qtyDisplay = item.quantity.toString();
          if (isKg && item.weight) {
              const weightKg = (item.weight / 1000).toFixed(3); 
              const weightStr = `${parseFloat(weightKg)}kg`; 
              
              if (item.quantity > 1) {
                  qtyDisplay = `${item.quantity} x ${weightStr}`;
              } else {
                  qtyDisplay = weightStr;
              }
          }

          const splitDesc = doc.splitTextToSize(desc, 75);
          
          doc.text(splitDesc, margin + 5, y);
          doc.text(qtyDisplay, margin + 85, y);
          doc.text(`R${price}`, margin + 115, y);
          doc.text(`R${itemTotal.toFixed(2)}`, margin + 150, y);
          
          y += (splitDesc.length * 6) + 2;
        });

        y += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, 190, y);
        
        y += 10;

        // --- Summary ---
        const subtotal = order.total - (order.deliveryFee || 0) + (order.discountUsed || 0);
        const labelX = 130;
        const valueX = 190;

        doc.setFont("helvetica", "bold");
        doc.text("Subtotal:", labelX, y);
        doc.text(`R${subtotal.toFixed(2)}`, valueX, y, { align: 'right' });
        
        if (order.deliveryFee) {
            y += 8;
            doc.setFont("helvetica", "normal");
            doc.text(`Delivery Fee (${order.distanceKm || 0}km):`, labelX, y);
            doc.text(`R${order.deliveryFee.toFixed(2)}`, valueX, y, { align: 'right' });
        }

        if (order.discountUsed) {
            y += 8;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(200, 0, 0);
            doc.text("Total Discount:", labelX, y);
            doc.text(`-R${order.discountUsed.toFixed(2)}`, valueX, y, { align: 'right' });
            doc.setTextColor(0, 0, 0);

            if (order.promoCodeApplied) {
                y += 5;
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.setFont("helvetica", "italic");
                const detailText = `(${order.promoCodeApplied})`;
                doc.text(detailText, valueX, y, { align: 'right' });
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0, 0, 0);
                y += 2;
            }
        }

        y += 12;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        
        const totalLabel = type === 'ESTIMATE' ? "TOTAL ESTIMATE:" : "FINAL TOTAL:";
        
        doc.text(totalLabel, labelX, y);
        doc.text(`R${order.total.toFixed(2)}`, valueX, y, { align: 'right' });

        // --- Banking Details (If Quote, Estimate or Invoice needs it) ---
        if (details.bankingDetails) {
            y += 20;
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text("ACCOUNT DETAILS:", margin, y);
            y += 6;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80, 80, 80);
            
            // Dynamic Reference Replacement
            let bankingText = details.bankingDetails;
            const refLabel = (type === 'QUOTE' || type === 'ESTIMATE') ? 'Quote' : 'Order';
            
            // If default text exists, replace it with specific ID
            if (bankingText.includes('Ref: Order Number') || bankingText.includes('Ref: Number')) {
                bankingText = bankingText.replace(/Ref:\s*Order\s*Number/i, `Ref: ${refLabel} #${order.id}`);
                bankingText = bankingText.replace(/Ref:\s*Number/i, `Ref: ${refLabel} #${order.id}`);
            } else if (!bankingText.toLowerCase().includes('ref:')) {
                // If no reference line exists, append one
                bankingText += `\nRef: ${refLabel} #${order.id}`;
            }

            const bankingLines = doc.splitTextToSize(bankingText, 100);
            doc.text(bankingLines, margin, y);
        }

        // --- Footer ---
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        const footerY = 280;
        
        doc.text(details.invoiceFooterText || "Thank you for choosing Meat Depot.", 105, footerY, { align: 'center' });
        
        if (type === 'QUOTE' || type === 'ESTIMATE') {
            doc.text("Quote valid for 7 days.", 105, footerY + 5, { align: 'center' });
        } else {
            doc.text("This is a computer-generated invoice.", 105, footerY + 5, { align: 'center' });
        }
    }

    // Save locally
    const filename = type === 'ORDER_AGREEMENT' 
        ? `MeatDepot_Agreement_${order.id}.pdf` 
        : `MeatDepot_${type}_${order.id}.pdf`;
        
    doc.save(filename);
    
    // Return Base64 Data URI
    return doc.output('datauristring');
    
  } catch (error) {
    console.error("PDF Generation Error", error);
    alert("Could not generate PDF. Please ensure you are connected to the internet.");
    return "";
  }
};
