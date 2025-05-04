 import React from 'react';

const PrivacyPolicy = () => {
  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', color: '#333' }}>
      <h1 style={{ borderBottom: '2px solid #2c3e50', color: '#2c3e50' }}>Privacy and Data Protection Policy</h1>
      <p><strong>Effective Date:</strong> 23/04/2025<br />
        <strong>Last Updated:</strong> 23/04/2025
      </p>

      <section>
        <h2>1. What Data We Collect</h2>
        <ul>
          <li><strong>Personal Information:</strong> Name, email, job title, company.</li>
          <li><strong>Location Data:</strong> Real-time or approximate location.</li>
          <li><strong>Device Information:</strong> IP address, device type, OS.</li>
          <li><strong>Usage Data:</strong> App interactions and feature usage.</li>
        </ul>
      </section>

      <section>
        <h2>2. How We Use Your Data</h2>
        <ul>
          <li>Display nearby colleagues.</li>
          <li>Improve and personalize your experience.</li>
          <li>Send relevant notifications (if opted in).</li>
          <li>Maintain service integrity and security.</li>
        </ul>
      </section>

      <section>
        <h2>3. Consent</h2>
        <p>We request your explicit consent to access your location and send notifications. You can control these settings at any time within the app.</p>
      </section>

      <section>
        <h2>4. Data Sharing</h2>
        <p>We do not sell or share your data with third parties. Only authorized app users can see approximate location  . Anonymized data may be used for improving the app.</p>
      </section>

 

      <section>
        <h2>6. Your Rights</h2>
        <ul>
          <li>Access your data</li>
          <li>Correct or delete your data</li>
          <li>Withdraw consent at any time</li>
          <li>Request a downloadable copy of your data</li>
        </ul>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>We retain data as long as needed for operation or legal reasons. Inactive accounts (12+ months) may be deleted after notice. You may delete your account and data manually at any time.</p>
      </section>

      <section>
        <h2>8. Cookies and Analytics</h2>
        <p>Cookies or local storage may be used for better functionality. Anonymized analytics may help improve app performance.</p>
      </section>

      <section>
        <h2>9. Legal Compliance</h2>
        <p>We comply with UK GDPR, the Data Protection Act 2018, and other relevant privacy regulations in the UK.</p>
      </section>

      <section>
        <h2>10. Contact Us</h2>
        <p>If you have any questions or concerns about your data, please contact us at:</p>
        <p><strong>Email:</strong> posiconnection@gmail.com<br />
         </p>
      </section>

      <footer style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        &copy; Wesynchro — All rights reserved.
      </footer>
    </main>
  );
};

export default PrivacyPolicy;
