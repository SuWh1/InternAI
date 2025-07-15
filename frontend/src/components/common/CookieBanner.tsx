import React, { useState, useEffect } from 'react';
import { hasCookieConsent, setCookieConsent, loadGoogleAnalytics } from '../../utils/analytics';

const GA_MEASUREMENT_ID = 'G-XSDQGCRFEW';

const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasCookieConsent()) {
      loadGoogleAnalytics(GA_MEASUREMENT_ID);
    } else {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    setCookieConsent(true);
    loadGoogleAnalytics(GA_MEASUREMENT_ID);
    setVisible(false);
  };

  const reject = () => {
    setCookieConsent(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#151515', color:'#fff', padding:'1rem', display:'flex', justifyContent:'space-between', zIndex:9999}}>
      <span>This site uses cookies to measure traffic with Google Analytics. Do you accept?</span>
      <div style={{display:'flex', gap:'0.5rem'}}>
        <button onClick={accept} style={{background:'#3b82f6', color:'#fff', border:'none', padding:'0.5rem 1rem', cursor:'pointer'}}>Accept</button>
        <button onClick={reject} style={{background:'#aaa', color:'#000', border:'none', padding:'0.5rem 1rem', cursor:'pointer'}}>Reject</button>
      </div>
    </div>
  );
};

export default CookieBanner; 