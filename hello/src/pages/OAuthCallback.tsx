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
    console.log('   OAUTH CALLBACK RECEIVED');
    console.log('   ========================================');
    console.log('Success:', success);
    console.log('Error:', error);
    console.log('Has accessToken:', !!accessToken);
    console.log('Has refreshToken:', !!refreshToken);
    console.log('Window opener exists:', !!window.opener);
    console.log('Window opener closed:', window.opener?.closed);
    console.log('   ========================================\n');

    // ERROR CASE
    if (error) {
      console.error('❌ OAuth Error:', error);
      setStatus('error');
      setMessage(`Authentication failed: ${error}`);

      // Store error for parent window
      try {
        localStorage.setItem('oauth_error', JSON.stringify({
          error: error,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Failed to store error:', e);
      }

      // Try to notify parent via postMessage
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({
            type: 'OAUTH_RESPONSE',
            success: false,
            error: error
          }, window.location.origin);
        } catch (e) {
          console.error('postMessage failed:', e);
        }
      }

      setTimeout(() => {
        window.close();
      }, 2000);
      return;
    }

    // SUCCESS CASE
    if (success === 'true' && accessToken && refreshToken) {
      console.log('✅ OAuth Success - Processing tokens');
      setStatus('success');
      setMessage('Login successful!');

      try {
        // CRITICAL: Store tokens in localStorage FIRST
        console.log('💾 Storing tokens in localStorage...');
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        console.log('✅ Tokens stored successfully');


        try {
          window.postMessage({
            type: 'SAVE_TOKENS',
            accessToken,
            refreshToken
          }, window.location.origin);
          console.log('📤 Tokens synced to extension');a
        } catch (e) {
          console.log('⚠️ Extension not installed');
        }

        // Store success flag with tokens for parent window
        localStorage.setItem('oauth_success', JSON.stringify({
          success: true,
          timestamp: Date.now(),
          hasTokens: true
        }));
        console.log('✅ Success flag stored');

        // Try postMessage to parent window
        if (window.opener && !window.opener.closed) {
          console.log('📤 Sending success message to parent window...');
          try {
            window.opener.postMessage({
              type: 'OAUTH_RESPONSE',
              success: true,
              hasTokens: true,
              timestamp: Date.now()
            }, window.location.origin);
            console.log('✅ Message sent to parent');
          } catch (e) {
            console.error('⚠️ postMessage failed:', e);
          }
        } else {
          console.warn('⚠️ No opener window available');
        }

        // Close popup after a short delay
        console.log('⏱️ Closing window in 500ms...');
        setTimeout(() => {
          console.log('🚪 Attempting to close window...');
          window.close();

          // Fallback: Show manual close UI if auto-close fails
          setTimeout(() => {
            if (!window.closed) {
              console.log('⚠️ Auto-close failed, showing manual close UI');
              showManualCloseUI();
            }
          }, 300);
        }, 500);

      } catch (error) {
        console.error('❌ Error processing success:', error);
        setStatus('error');
        setMessage('Failed to process authentication');
      }
      return;
    }

    // INVALID CASE - No tokens received
    console.error('❌ Invalid callback - Missing tokens');
    setStatus('error');
    setMessage('Authentication failed - no tokens received');

    setTimeout(() => {
      window.close();
    }, 2000);
  };

  const showManualCloseUI = () => {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#fff;font-family:system-ui;text-align:center;padding:2rem;">
        <div style="max-width:500px;">
          <div style="font-size:4rem;margin-bottom:1.5rem;">✅</div>
          <h1 style="font-size:2rem;color:#22c55e;margin-bottom:1rem;font-weight:bold;">Login Successful!</h1>
          <p style="font-size:1.1rem;color:#a1a1aa;margin-bottom:1.5rem;">
            You can now close this window
          </p>
          <button 
            onclick="window.close()" 
            style="padding:0.875rem 2rem;font-size:1rem;background:#22c55e;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;box-shadow:0 4px 12px rgba(34,197,94,0.3);transition:all 0.2s;"
            onmouseover="this.style.background='#16a34a'"
            onmouseout="this.style.background='#22c55e'"
          >
            Close Window
          </button>
          <p style="font-size:0.875rem;color:#71717a;margin-top:1rem;">
            Or manually close this tab/window
          </p>
        </div>
      </div>
    `;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center space-y-6 p-8 max-w-md">
        {status === 'processing' && (
          <>
            <div className="relative">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <h2 className="text-2xl font-bold text-white">Processing...</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="relative">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse"></div>
            </div>
            <h2 className="text-3xl font-bold text-green-400">Success!</h2>
            <p className="text-gray-300 text-lg">{message}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-400 animate-pulse">
                Closing window...
              </p>
              <p className="text-xs text-gray-500">
                If window doesn't close, you can manually close it
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="relative">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl"></div>
            </div>
            <h2 className="text-3xl font-bold text-red-400">Error</h2>
            <p className="text-gray-300">{message}</p>
            <p className="text-sm text-gray-500">
              Please close this window and try again
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;