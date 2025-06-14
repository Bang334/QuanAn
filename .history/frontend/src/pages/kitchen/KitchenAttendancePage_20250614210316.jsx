import React, { useState, useEffect } from 'react';

const KitchenAttendancePage = () => {
  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      background: 'white' 
    }}>
      <h1 style={{ color: 'red', fontSize: '32px' }}>TEST PAGE - NO LAYOUT</h1>
      
      <div style={{ 
        border: '2px solid blue',
        padding: '20px',
        borderRadius: '8px',
        background: '#f0f0ff',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <h2>Chấm công & Lịch làm việc</h2>
        <p>Đây là trang hiển thị chấm công và lịch làm việc đơn giản không qua layout</p>
      </div>
      
      <div style={{
        border: '2px solid green',
        padding: '20px',
        borderRadius: '8px',
        background: '#f0fff0'
      }}>
        <h3>Debug Info</h3>
        <pre style={{ background: '#eee', padding: '10px', borderRadius: '5px' }}>
          Time: {new Date().toLocaleString()}
        </pre>
      </div>
    </div>
  );
};

export default KitchenAttendancePage;
