import React, { useEffect, useState, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Helmet } from 'react-helmet';
import { useHistory } from 'react-router-dom';

import 'xterm/css/xterm.css';
import './home.css';

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const Home = () => {
  const defaultCode = `#include <iostream>

using namespace std;

int main() {
    cout << "Fusion World!" << endl;
    return 0;
}`;

  const [editorValue, setEditorValue] = useState(defaultCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionID, setSessionID] = useState(null);
  const terminalRef = useRef(null);
  const terminalContainerRef = useRef(null);
  const inputBufferRef = useRef('');
  const isWaitingForInputRef = useRef(false);

  const history = useHistory();

  const navigateToAboutUs = () => {
    history.push('/about-us');
  };

  useEffect(() => {
    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [{ background: 'FFFFFF' }],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000'
      }
    });

    const editor = monaco.editor.create(document.getElementById('editor-container'), {
      value: defaultCode,
      language: 'cpp',
      theme: 'custom-light',
      automaticLayout: true,
      lineNumbers: "on",
      selectOnLineNumbers: true,
      renderLineHighlight: "line",
      scrollBeyondLastLine: false,
      readOnly: false
    });

    editor.onDidChangeModelContent(() => {
      setEditorValue(editor.getValue());
    });

    if (!sessionID) {
      const newSessionID = generateSessionID();
      setSessionID(newSessionID);
    }

    // Initialize xterm with improved setup
    const term = new Terminal({
      fontFamily: '"Courier New", monospace',
      fontSize: 15,
      fontWeight: 'bold',
      cursorBlink: true,
      theme: {
        background: '#444444'
      },
      scrollback: 1000,
      convertEol: true
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Ensure the terminal container is ready before opening the terminal
    if (terminalContainerRef.current) {
      term.open(terminalContainerRef.current);
      
      // Use setTimeout to ensure the terminal is fully rendered before fitting
      setTimeout(() => {
        fitAddon.fit();
      }, 0);
    }

    terminalRef.current = term;

    // Debounced copy function
    const debouncedCopy = debounce(() => {
      if (term.hasSelection()) {
        navigator.clipboard.writeText(term.getSelection());
      }
    }, 100);

    // Debounced paste function
    const debouncedPaste = debounce(() => {
      navigator.clipboard.readText().then(text => {
        inputBufferRef.current += text;
        term.write(text);
      });
    }, 100);

    // Enable copy/paste
    term.attachCustomKeyEventHandler((event) => {
      const specialKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
      if (specialKeys.includes(event.key)) {
        return false; // Let the default behavior happen
      }
      if (event.ctrlKey && event.key === 'c') {
        debouncedCopy();
        return false; // Prevent default behavior
      }
      if (event.ctrlKey && event.key === 'v') {
        debouncedPaste();
        return false; // Prevent default behavior
      }
      return true; // Allow default behavior for other keys
    });

    term.onKey(({ key, domEvent }) => {
      if (isWaitingForInputRef.current) {
        if (domEvent.key === 'Enter') {
          const input = inputBufferRef.current;
          inputBufferRef.current = '';
          term.write('\r\n');
          handleInput(input);
        } else if (domEvent.key === 'Backspace') {
          if (inputBufferRef.current.length > 0) {
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
            term.write('\b \b');
          }
        } else if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(domEvent.key)) {
          inputBufferRef.current += key;
          term.write(key);
        }
      }
    });

    return () => {
      editor.dispose();
      if (term) {
        term.dispose();
      }
    };
  }, [sessionID]);

  const handleRun = async () => {
    if (!sessionID) {
      setError('Session ID is not set.');
      return;
    }

    setLoading(true);
    setError('');
    clearTerminal();
    isWaitingForInputRef.current = false;
    inputBufferRef.current = '';
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Session-ID': sessionID,
        },
        body: JSON.stringify({ code: editorValue }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { output, requiresInput } = await response.json();
      if (terminalRef.current) {
        terminalRef.current.write(output);
        terminalRef.current.focus();
      }
      isWaitingForInputRef.current = requiresInput;
    } catch (error) {
      console.error('Error running the code:', error);
      setError('Failed to run code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = async (input) => {
    if (!sessionID) {
      setError('Session ID is not set.');
      return;
    }

    setLoading(true);
    setError('');
    isWaitingForInputRef.current = false;
    try {
      const response = await fetch('/api/input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Session-ID': sessionID,
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { output, requiresInput } = await response.json();
      if (requiresInput) {
        const inputWithNewline = input + '\r\n';
        let newOutput = output;
        if (newOutput.startsWith(inputWithNewline)) {
          newOutput = newOutput.slice(inputWithNewline.length);
        }
        if (terminalRef.current) {
          terminalRef.current.write(newOutput);
        }
      } else {
        terminalRef.current.clear();
        terminalRef.current.write(output);
      }
      isWaitingForInputRef.current = requiresInput;
    } catch (error) {
      console.error('Error submitting input:', error);
      setError('Failed to submit input. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (terminalRef.current) {
      clearTerminal();
    }
  };

  const clearTerminal = () => {
    terminalRef.current.clear();
    terminalRef.current.write('\x1b[H\x1b[2J');
    inputBufferRef.current = '';
    isWaitingForInputRef.current = false;
  }

  const generateSessionID = () => {
    return 'sess-' + Math.random().toString(36).substr(2, 9);
  };

  return (
    <div className="home-container1">
      <Helmet>
        <title>Fusion Compiler</title>
        <meta property="og:title" content="Fusion Compiler" />
      </Helmet>
      <div className="home-navbar-container">
        <div className="home-title-container">
          <img alt="image" src="/favicon.png" className="home-image" />
          <span className="home-text1">Fusion Compiler</span>
        </div>
        <div className="home-about-us-container">
          <button type="button" className="home-button1 button" onClick={navigateToAboutUs}>
            About Us
          </button>
        </div>
      </div>
      <div className="home-body-container">
        <div className="home-text-editor-container">
          <div className="home-container2">
            <span className="home-text2">
              <span>main.cpp</span>
              <br />
            </span>
            <button
              type="button"
              className="home-button2 button"
              onClick={handleRun}
              disabled={loading}
            >
              <span>
                {loading ? 'Running...' : 'Run'}
                <br />
              </span>
            </button>
          </div>
          <div id="editor-container" className="editor-container"></div>
        </div>
        <div className="home-console-container">
          <div className="home-container3">
            <span className="home-text8">
              <span>Output</span>
              <br />
            </span>
            <button
              type="button"
              className="home-button3 button"
              onClick={handleClear}
              disabled={loading}
            >
              <span>
                {loading ? 'Clearing...' : 'Clear'}
                <br />
              </span>
            </button>
          </div>
          <div ref={terminalContainerRef} className="terminal-container"></div>
        </div>
      </div>
    </div>
  );
};

export default Home;