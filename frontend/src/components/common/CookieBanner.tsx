import React, { useState, useEffect } from 'react';
import { hasCookieConsent, setCookieConsent } from '../../utils/analytics';

const GA_MEASUREMENT_ID = 'G-XSDQGCRFEW';

const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasCookieConsent()) {
      // If consent was previously given, update GA consent and send initial pageview
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          'ad_storage': 'granted',
          'analytics_storage': 'granted'
        });
        (window as any).gtag('config', GA_MEASUREMENT_ID, { 'page_path': window.location.pathname });
      }
    } else {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    setCookieConsent(true);
    // Update GA consent and send pageview immediately upon acceptance
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'ad_storage': 'granted',
        'analytics_storage': 'granted'
      });
      (window as any).gtag('config', GA_MEASUREMENT_ID, { 'page_path': window.location.pathname });
    }
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