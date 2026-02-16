import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>e-Khata - Digital Ledger System</h1>
        <p>Welcome to e-Khata, your comprehensive digital khata (ledger) solution.</p>
        
        <div style={{ marginTop: '30px' }}>
          <h2>Features:</h2>
          <ul>
            <li>Multi-tenant architecture for multiple businesses</li>
            <li>User authentication with role-based access control</li>
            <li>Party (customer/supplier) management</li>
            <li>Complete debit/credit transaction system</li>
            <li>Payment gateway integration (Easypaisa & JazzCash)</li>
            <li>Real-time notifications</li>
            <li>Firebase OTP verification</li>
            <li>Comprehensive audit logging</li>
            <li>Session management with device tracking</li>
          </ul>
        </div>

        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <h3>Getting Started</h3>
          <p>To use this application:</p>
          <ol>
            <li>Create a tenant account for your business</li>
            <li>Set up user accounts with appropriate roles</li>
            <li>Add your business parties (customers/suppliers)</li>
            <li>Start recording transactions</li>
          </ol>
        </div>

        <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
          <p>Developed by <a href="https://www.esystematics.com">Esystematic Technologies</a></p>
          <p>Gujranwala, Pakistan</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
