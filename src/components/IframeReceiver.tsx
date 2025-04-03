
import React, { useEffect } from 'react';

interface IframeReceiverProps {
  children: React.ReactNode;
}

const IframeReceiver: React.FC<IframeReceiverProps> = ({ children }) => {
  useEffect(() => {
    // Send ready message to parent when iframe is loaded
    if (window.parent && window.parent !== window) {
      console.log('Sending IFRAME_READY message to parent window');
      window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
    }

    // Function to handle window resize from parent instructions
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        // Handle specific message types if needed
        if (event.data.type === 'RESIZE_IFRAME') {
          console.log('Received resize request:', event.data);
          // Additional iframe-specific handlers could go here
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return <>{children}</>;
};

export default IframeReceiver;
