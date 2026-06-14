import { useEffect, useState, useRef } from 'react';
import { PORTS } from '@archlab/shared';

interface AppPreviewProps {
  projectId: string | null;
  projectPath: string | null;
  projectName: string | null;
}

export function AppPreview({ projectId, projectPath, projectName }: AppPreviewProps) {
  const [url, setUrl] = useState('http://localhost:3000');
  const [iframeUrl, setIframeUrl] = useState('http://localhost:3000');
  const [devCommand, setDevCommand] = useState<string | null>(null);
  const [suggestedPort, setSuggestedPort] = useState<number>(3000);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-detect scripts and ports from package.json
  useEffect(() => {
    if (!projectId) return;
    
    const BASE = `http://127.0.0.1:${PORTS.backend}`;
    fetch(`${BASE}/file?projectId=${encodeURIComponent(projectId)}&path=package.json`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.content) {
          try {
            const pkg = JSON.parse(data.content);
            const scripts = pkg.scripts || {};
            
            // Look for dev commands
            const devCmd = scripts.dev || scripts.start || Object.keys(scripts)[0];
            if (devCmd) {
              setDevCommand(scripts.dev ? 'npm run dev' : scripts.start ? 'npm start' : `npm run ${devCmd}`);
            }

            // Guess port based on dependencies
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            let port = 3000;
            if (deps.vite) {
              port = 5173;
            } else if (deps['next']) {
              port = 3000;
            } else if (deps['@remix-run/dev']) {
              port = 3000;
            } else if (deps.gatsby) {
              port = 8000;
            }
            
            setSuggestedPort(port);
            setUrl(`http://localhost:${port}`);
            setIframeUrl(`http://localhost:${port}`);
          } catch (e) {
            // Not a valid package.json or other project
          }
        }
      })
      .catch(() => {});
  }, [projectId]);

  const handleRefresh = () => {
    setLoading(true);
    setIframeUrl('');
    setTimeout(() => {
      setIframeUrl(url);
      setLoading(false);
    }, 100);
  };

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'http://' + targetUrl;
      setUrl(targetUrl);
    }
    setIframeUrl(targetUrl);
  };

  const openExternal = () => {
    window.open(iframeUrl, '_blank');
  };

  return (
    <div className="app-preview-container">
      {/* Browser Mockup Window */}
      <div className="browser-mockup">
        {/* Browser Top Bar */}
        <div className="browser-header">
          {/* Window Buttons */}
          <div className="browser-dots">
            <span className="dot dot-close" />
            <span className="dot dot-minimize" />
            <span className="dot dot-maximize" />
          </div>

          {/* Navigation Controls */}
          <div className="browser-nav-actions">
            <button className="browser-nav-btn" onClick={() => handleRefresh()} title="Reload Page">
              🔄
            </button>
          </div>

          {/* Address Bar */}
          <form className="browser-address-form" onSubmit={handleGo}>
            <div className="browser-address-bar">
              <span className="browser-address-lock" title="Local Connection">🔒</span>
              <input
                type="text"
                className="browser-address-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL (e.g. http://localhost:3000)"
              />
            </div>
          </form>

          {/* External Action Button */}
          <button className="btn btn-browser-external" onClick={openExternal} title="Open in Chrome / Safari">
            🌐 Open in Browser
          </button>
        </div>

        {/* Browser Viewport */}
        <div className="browser-viewport">
          {iframeUrl ? (
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className="browser-iframe"
              title="App Preview"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          ) : (
            <div className="browser-loading">Reloading Preview...</div>
          )}
        </div>
      </div>

      {/* Guide/Instruction Banner */}
      <div className="app-preview-guide">
        <div className="guide-icon">💡</div>
        <div className="guide-content">
          <h4>How to Preview Your App</h4>
          <p>
            Start your project's local development server in the terminal below.
            {devCommand && (
              <>
                {' '}Run <code className="guide-code">{devCommand}</code>.
              </>
            )}
            {' '}Once the server is running, make sure the address bar port matches your local server port (suggested: <code className="guide-code">{suggestedPort}</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
