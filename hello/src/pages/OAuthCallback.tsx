import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = () => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    console.log('\n🎯 ========================================');
    console.log('   OAUTH CALLBACK');
    console.log('   ========================================');
    console.log('Success:', success);
    console.log('Error:', error);
    console.log('Has accessToken:', !!accessToken);
    console.log('Has refreshToken:', !!refreshToken);
    console.log('   ========================================\n');

    if (success === 'true' && accessToken && refreshToken) {
      console.log('✅ SUCCESS WITH TOKENS');
      setStatus('success');
      setMessage('Login successful!');

      // Store tokens in localStorage
      console.log('💾 Storing tokens in localStorage');
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Notify parent window
      console.log('📦 Storing success in localStorage for parent');
      localStorage.setItem('oauth_success', JSON.stringify({
        success: true,
        timestamp: Date.now(),
        hasTokens: true
      }));

      // Also try postMessage
      if (window.opener && !window.opener.closed) {
        console.log('📤 Sending via postMessage');
        try {
          window.opener.postMessage({
            type: 'OAUTH_RESPONSE',
            success: true,
            timestamp: Date.now()
          }, window.location.origin);
        } catch (e) {
          console.log('⚠️ postMessage failed:', e);
        }
      }

      // Close popup
      console.log('🚪 Closing window in 1 second');
      setTimeout(() => {
        window.close();
        
        // Fallback UI if can't close
        setTimeout(() => {
          if (!window.closed) {
            console.log('⚠️ Could not close automatically');
            document.body.innerHTML = `
              <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#fff;font-family:system-ui;text-align:center;padding:2rem;">
                <div style="max-width:500px;">
                  <div style="font-size:5rem;margin-bottom:1.5rem;">✅</div>
                  <h1 style="font-size:2.5rem;color:#22c55e;margin-bottom:1rem;font-weight:bold;">Login Successful!</h1>
                  <p style="font-size:1.3rem;color:#a1a1aa;margin-bottom:2rem;">Authentication complete!</p>
                  <p style="font-size:1rem;color:#71717a;margin-bottom:2rem;">Please close this window to continue</p>
                  <button onclick="window.close()" style="padding:1rem 2.5rem;font-size:1.1rem;background:#22c55e;color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:600;box-shadow:0 4px 12px rgba(34,197,94,0.3);">
                    Close Window
                  </button>
                </div>
              </div>
            `;
          }
        }, 200);
      }, 1000);
      
      return;
    }

    if (error) {
      console.log('❌ ERROR:', error);
      setStatus('error');
      setMessage(`Authentication failed: ${error}`);
      
      localStorage.setItem('oauth_error', JSON.stringify({
        error: error,
        timestamp: Date.now()
      }));
      
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({
            type: 'OAUTH_RESPONSE',
            success: false,
            error: error
          }, window.location.origin);
        } catch (e) {
          console.log('⚠️ postMessage failed:', e);
        }
      }
      
      setTimeout(() => window.close(), 2000);
      return;
    }

    console.warn('⚠️ INVALID CALLBACK - Missing tokens');
    setStatus('error');
    setMessage('Authentication failed - no tokens received');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center space-y-6 p-8 max-w-md">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-white">Processing...</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-green-400">Success!</h2>
            <p className="text-gray-300 text-lg">{message}</p>
            <p className="text-sm text-gray-500 animate-pulse">
              Closing window...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-red-400">Error</h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;