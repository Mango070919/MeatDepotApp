
import { Order, UnitType, AppConfig } from '../types';

const ESC = '\x1B';
const GS = '\x1D';

export class ThermalPrinterService {
  private port: any;
  private writer: WritableStreamDefaultWriter | null = null;
  public isConnected: boolean = false;

  async connect() {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported in this browser.');
    }

    try {
      // Request a port and open a connection.
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 9600 });
      this.writer = this.port.writable.getWriter();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Printer Connection Error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
    this.isConnected = false;
  }

  async printOrder(order: Order, config: AppConfig) {
    if (!this.writer) return false;

    const encoder = new TextEncoder();
    const send = async (text: string) => await this.writer!.write(encoder.encode(text));
    const sendBytes = async (bytes: number[]) => await this.writer!.write(new Uint8Array(bytes));

    try {
      // Initialize Printer
      await send(ESC + '@');

      // --- HEADER ---
      await send(ESC + 'a' + '\x01'); // Align Center
      await send(ESC + 'E' + '\x01'); // Bold On
      // Double Height/Width for Company Name
      await send(GS + '!' + '\x11'); 
      await send((config.businessDetails?.companyName || 'MEAT DEPOT') + '\n');
      await send(GS + '!' + '\x00'); // Normal Size
      await send(ESC + 'E' + '\x00'); // Bold Off
      
      await send((config.businessDetails?.addressLine1 || '') + '\n');
      await send((config.businessDetails?.contactNumber || '') + '\n');
      await send('\n');

      // --- ORDER INFO ---
      await send(ESC + 'a' + '\x00'); // Align Left
      await send(`Order: #${order.id}\n`);
      await send(`Date:  ${new Date(order.createdAt).toLocaleString()}\n`);
      await send('--------------------------------\n');

      // --- ITEMS ---
      for (const item of order.items) {
        const isKg = item.product.unit === UnitType.KG;
        const lineTotal = isKg && item.weight
            ? (item.product.price / 1000) * item.weight * item.quantity
            : item.product.price * item.quantity;

        // Line 1: Product Name
        await send(ESC + 'E' + '\x01'); // Bold Product Name
        await send(`${item.product.name}\n`);
        await send(ESC + 'E' + '\x00'); // Bold Off

        // Line 2: Details & Price
        let details = '';
        if (isKg) {
            details = `${item.quantity} x ${item.weight}g @ R${item.product.price}/kg`;
        } else {
            details = `${item.quantity} x R${item.product.price}`;
        }
        
        // Simple spacing calculation (assuming ~32 char width for standard 58mm/80mm)
        // A robust implementation would pad strings based on paper width
        await send(`${details} ... R${lineTotal.toFixed(2)}\n`);
        await send('\n');
      }

      await send('--------------------------------\n');

      // --- TOTALS ---
      await send(ESC + 'a' + '\x02'); // Align Right
      await send(ESC + 'E' + '\x01'); // Bold On
      await send(GS + '!' + '\x01'); // Double Height
      await send(`TOTAL: R${order.total.toFixed(2)}\n`);
      await send(GS + '!' + '\x00'); // Normal Size
      await send(ESC + 'E' + '\x00'); // Bold Off
      await send(ESC + 'a' + '\x00'); // Align Left

      // --- FOOTER ---
      await send('\n');
      await send(ESC + 'a' + '\x01'); // Align Center
      await send('Thank you for your support!\n');
      await send('Please retain slip for refund.\n');
      
      // Feed 4 lines
      await send('\n\n\n\n');
      
      // Cut Paper (GS V m n)
      await sendBytes([0x1D, 0x56, 0x41, 0x00]); 

      return true;
    } catch (e) {
      console.error("Printing failed:", e);
      return false;
    }
  }
}
