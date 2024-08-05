import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import './App.css';

function App() {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [section, setSection] = useState('Python');
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);

  const downloadAndRun = async (url: string) => {
    setIsDownloading(true);
    await invoke('download_and_run', { url });
    setIsDownloading(false);
    setProgress(0);
  };

  useEffect(() => {
    const unlisten = listen('progress', (event: any) => {
      const [downloaded, total] = event.payload;
      setProgress(Math.round((downloaded / total) * 100));
    });
    return () => unlisten.then((f) => f());
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-theme', darkTheme);
  }, [darkTheme]);

  const handleThemeSwitch = () => setDarkTheme((prev) => !prev);

  const renderDownloadButtons = () => {
    switch (section) {
      case 'Python':
        return (
          <>
            <button
              onClick={() =>
                downloadAndRun(
                  'https://www.python.org/ftp/python/3.12.4/python-3.12.4-amd64.exe'
                )
              }
            >
              Python 3.12
            </button>
            <button
              onClick={() =>
                downloadAndRun(
                  'https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe'
                )
              }
            >
              Python 3.11
            </button>
            <button
              onClick={() =>
                downloadAndRun(
                  'https://www.python.org/ftp/python/3.10.0/python-3.10.0-amd64.exe'
                )
              }
            >
              Python 3.10
            </button>
          </>
        );
      case 'Java':
        return (
          <button
            onClick={() =>
              downloadAndRun(
                'https://javadl.oracle.com/webapps/download/AutoDL?BundleId=250111_d8aa705069af427f9b83e66b34f5e380'
              )
            }
          >
            Java
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className='app'>
      <button
        className='menu-button'
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        &#9776;
      </button>
      <button className='theme-switcher' onClick={handleThemeSwitch}>
        {darkTheme ? 'Light Mode' : 'Dark Mode'}
      </button>
      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <ul>
          <li onClick={() => setSection('Python')}>Python</li>
          <li onClick={() => setSection('Java')}>Java</li>
        </ul>
      </div>
      <div className='main'>
        <h1>Welcome to the Download App</h1>
        <p className='page-text'>
          Choose a section from the menu to view and download the latest
          versions of various software.
        </p>
        {isDownloading ? (
          <div className='overlay'>
            <div className='progress-bar'>
              <div className='progress' style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ) : (
          renderDownloadButtons()
        )}
      </div>
    </div>
  );
}

export default App;
