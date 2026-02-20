
import React, { useEffect, useState } from 'react';
import { Order, UnitType } from '../../types';
import QRCode from 'qrcode';
import { useApp } from '../../store';

const ReceiptTemplate: React.FC<{ order: Order }> = ({ order }) => {
  const { config } = useApp();
  const date = new Date(order.createdAt).toLocaleString();
  const [qrData, setQrData] = useState('');

  useEffect(() => {
      // Generate QR for tracking tracking/viewing online
      const url = `https://meatdepot.co.za/track/${order.id}`;
      QRCode.toDataURL(url, { margin: 0, width: 100 })
        .then(setQrData)
        .catch(err => console.error("QR Gen Error", err));
  }, [order.id]);

  return (
    <div id="receipt-print-area" className="hidden">
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{config.businessDetails?.companyName || 'MEAT DEPOT'}</h1>
        <p style={{ fontSize: '12px', margin: 0 }}>{config.businessDetails?.addressLine1}</p>
        <p style={{ fontSize: '12px', margin: 0 }}>{config.businessDetails?.contactNumber}</p>
      </div>

      <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '5px 0', margin: '10px 0', fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Order: #{order.id}</span>
          <span>{date}</span>
        </div>
      </div>

      <table style={{ width: '100%', fontSize: '12px', marginBottom: '10px' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th>Item</th>
            <th style={{ textAlign: 'right' }}>Amt</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => {
             const price = item.product.unit === UnitType.KG && item.weight
                ? (item.product.price / 1000) * item.weight * item.quantity
                : item.product.price * item.quantity;
             
             return (
              <tr key={idx}>
                <td>
                    {item.product.name}<br/>
                    <small>{item.quantity} x {item.product.unit === UnitType.KG ? `${item.weight}g` : `R${item.product.price}`}</small>
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'top' }}>R{price.toFixed(2)}</td>
              </tr>
             );
          })}
        </tbody>
      </table>

      <div style={{ borderTop: '1px solid black', paddingTop: '5px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
        <span>TOTAL</span>
        <span>R{order.total.toFixed(2)}</span>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div style={{ display: 'inline-block', padding: '5px', border: '2px solid black' }}>
            {qrData && <img src={qrData} style={{ width: '80px', height: '80px' }} alt="Order QR" />}
        </div>
        <p style={{ fontSize: '10px', marginTop: '5px' }}>Scan for digital copy</p>
      </div>

      {config.receiptNotice?.isActive && (
          <div style={{ marginTop: '15px', padding: '10px', border: '1px solid black', borderRadius: '5px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '12px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>{config.receiptNotice.title}</h3>
              <p style={{ fontSize: '12px', margin: 0 }}>{config.receiptNotice.message}</p>
          </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
        <p>Thank you for supporting local!</p>
      </div>
    </div>
  );
};

export default ReceiptTemplate;
