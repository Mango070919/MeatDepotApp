
import { Order, UnitType, Product, OrderStatus } from "../types";

export const generateSalesReport = async (
  orders: Order[], 
  products: Product[], // We pass current products to get the latest costing if historical is missing
  startDate: string, 
  endDate: string
): Promise<void> => {
  try {
    const { jsPDF } = await import('https://esm.sh/jspdf@^2.5.1');
    const doc = new jsPDF();
    const margin = 15;
    let y = margin;

    // --- Helper: Calculate Cost ---
    const calculateItemCost = (item: any): number => {
        // 1. Try to use costing from the item snapshot (if preserved)
        let costing = item.product.costing;
        
        // 2. If not in snapshot, find current product registry
        if (!costing) {
            const currentProduct = products.find(p => p.id === item.productId);
            costing = currentProduct?.costing;
        }

        if (!costing) return 0;

        let unitCost = 0;

        // CHECK 1: New Simplified System
        if (costing.totalCost !== undefined && costing.totalCost > 0) {
            unitCost = costing.totalCost;
        } 
        // CHECK 2: Legacy Complex System (Fallback)
        else {
            const baseCost = 
                (costing.rawMeatCost || 0) + 
                (costing.spicesCost || 0) + 
                (costing.packagingCost || 0) + 
                (costing.labelCost || 0);
            
            const overhead = baseCost * ((costing.overheadPercent || 0) / 100);
            unitCost = baseCost + overhead;
        }

        // Calculate Total Cost for this line item based on Unit Type
        if (item.product.unit === UnitType.KG && item.weight) {
            // If KG item, unitCost is per KG.
            // item.weight is in grams.
            return (unitCost / 1000) * item.weight * item.quantity;
        } else {
            return unitCost * item.quantity;
        }
    };

    const calculateItemRevenue = (item: any): number => {
        if (item.product.unit === UnitType.KG && item.weight) {
            return (item.product.price / 1000) * item.weight * item.quantity;
        }
        return item.product.price * item.quantity;
    };

    // --- Filter Orders ---
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59); // End of day

    const reportOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        // Include completed, delivered, or manual sales. Exclude pending/cancelled if desired.
        // For financial tracking, usually 'DELIVERED' or 'MANUAL_SALE' are "Realized Revenue".
        // We will include everything except 'QUOTE_REQUEST'.
        return d >= start && d <= end && o.status !== OrderStatus.QUOTE_REQUEST;
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // --- Aggregates ---
    let totalRevenue = 0;
    let totalCost = 0;

    // --- HEADER ---
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(244, 211, 0); // Brand Yellow
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SALES & PROFIT REPORT", margin, 20);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, margin, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 35);

    y = 50;

    // --- TABLE HEADERS ---
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 6, 180, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    
    const colX = { date: margin, id: margin + 25, item: margin + 50, rev: margin + 110, cost: margin + 135, prof: margin + 160 };
    
    doc.text("Date", colX.date, y);
    doc.text("Order #", colX.id, y);
    doc.text("Product", colX.item, y);
    doc.text("Revenue", colX.rev, y);
    doc.text("Est. Cost", colX.cost, y);
    doc.text("Profit", colX.prof, y);

    y += 8;
    doc.setFont("helvetica", "normal");

    // --- ROWS ---
    reportOrders.forEach(order => {
        order.items.forEach(item => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }

            const revenue = calculateItemRevenue(item);
            const cost = calculateItemCost(item);
            const profit = revenue - cost;

            totalRevenue += revenue;
            totalCost += cost;

            const dateStr = new Date(order.createdAt).toLocaleDateString();
            const idStr = order.id.substring(0, 6);
            let nameStr = item.product.name;
            if (nameStr.length > 25) nameStr = nameStr.substring(0, 25) + '...';

            doc.text(dateStr, colX.date, y);
            doc.text(idStr, colX.id, y);
            doc.text(nameStr, colX.item, y);
            doc.text(`R${revenue.toFixed(2)}`, colX.rev, y);
            
            // Highlight Missing Costs
            if (cost === 0) {
                doc.setTextColor(200, 0, 0);
                doc.text("-", colX.cost, y);
                doc.setTextColor(0, 0, 0);
            } else {
                doc.text(`R${cost.toFixed(2)}`, colX.cost, y);
            }

            // Profit Color
            if (profit > 0) doc.setTextColor(0, 150, 0);
            else if (profit < 0) doc.setTextColor(200, 0, 0);
            
            doc.text(`R${profit.toFixed(2)}`, colX.prof, y);
            doc.setTextColor(0, 0, 0);

            y += 6;
        });
        // Tiny separator between orders
        y += 2;
    });

    // --- SUMMARY SECTION ---
    const totalProfit = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    if (y > 240) {
        doc.addPage();
        y = 20;
    } else {
        y += 10;
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, 190, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.text("Total Revenue (Sales):", margin, y);
    doc.text(`R${totalRevenue.toFixed(2)}`, 100, y);
    y += 8;

    doc.text("Total Estimated Cost (COGS):", margin, y);
    doc.text(`R${totalCost.toFixed(2)}`, 100, y);
    y += 8;

    doc.setFillColor(244, 211, 0);
    doc.rect(margin, y - 5, 90, 10, 'F');
    doc.text("Gross Profit:", margin + 2, y + 2);
    doc.text(`R${totalProfit.toFixed(2)}`, 100, y + 2);
    
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.text(`Profit Margin: ${marginPercent.toFixed(1)}%`, margin, y);

    y += 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("* Costs are based on the 'Product Costing' values set in the inventory manager at the time of report generation.", margin, y);
    doc.text("* If costs are zero, please update product costing details.", margin, y + 4);

    doc.save(`MeatDepot_Report_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.pdf`);

  } catch (error) {
    console.error("Report Generation Failed", error);
    alert("Could not generate report. Please try again.");
  }
};
