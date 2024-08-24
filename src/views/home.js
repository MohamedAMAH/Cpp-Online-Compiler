// import React, { useEffect, useState } from 'react';
// import * as monaco from 'monaco-editor';
// import { Helmet } from 'react-helmet';
// import './home.css';

// const Home = () => {
//   const defaultCode = `#include <iostream>

// using namespace std;

// int main() {
//     cout << "Fusion!!" << endl;
//     return 0;
// }`;

//   const [editorValue, setEditorValue] = useState(defaultCode);
//   const [outputValue, setOutputValue] = useState('');
//   const [loading, setLoading] = useState(false); // Loading state
//   const [error, setError] = useState(''); // Error state
//   const [sessionID, setSessionID] = useState(null); // State to store session ID

//   useEffect(() => {
//     // Initialize Monaco Editor
//     const editor = monaco.editor.create(document.getElementById('editor-container'), {
//       value: defaultCode,
//       language: 'cpp',
//       theme: 'vs-light',
//       automaticLayout: true,
//       lineNumbers: "on",
//       selectOnLineNumbers: true,
//       renderLineHighlight: "line",
//       scrollBeyondLastLine: false,
//     });

//     editor.onDidChangeModelContent(() => {
//       setEditorValue(editor.getValue());
//     });

//     // Retrieve session ID from localStorage or create a new one
//     let storedSessionID = localStorage.getItem('sessionID');
//     if (!storedSessionID) {
//       storedSessionID = generateSessionID(); // Function to generate a new session ID
//       localStorage.setItem('sessionID', storedSessionID);
//     }
//     setSessionID(storedSessionID);

//     // Cleanup on component unmount
//     return () => {
//       const cleanup = async () => {
//         try {
//           await fetch('/api/cleanup', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Session-ID': sessionID, // Include session ID in headers
//             },
//           });
//         } catch (error) {
//           console.error('Error during cleanup:', error);
//         }
//       };

//       cleanup();
//     };
//   }, [sessionID]);

//   const handleRun = async () => {
//     if (!sessionID) {
//       setError('Session ID is not set.');
//       return;
//     }

//     setLoading(true);
//     setError('');
//     try {
//       const response = await fetch('/api/run', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Session-ID': sessionID, // Include session ID in headers
//         },
//         body: JSON.stringify({ code: editorValue }),
//       });

//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }

//       const { output } = await response.json();
//       setOutputValue(output);
//     } catch (error) {
//       console.error('Error running the code:', error);
//       setError('Failed to run code. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClear = async () => {
//     if (!sessionID) {
//       setError('Session ID is not set.');
//       return;
//     }

//     setLoading(true);
//     setError('');
//     try {
//       const response = await fetch('/api/clear', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Session-ID': sessionID, // Include session ID in headers
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }

//       const data = await response.json();
//       if (data.message === 'Output cleared') {
//         setOutputValue('');
//       }
//     } catch (error) {
//       console.error('Error clearing the output:', error);
//       setError('Failed to clear output. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Generate a new session ID
//   const generateSessionID = () => {
//     return 'sess-' + Math.random().toString(36).substr(2, 9);
//   };

//   return (
//     <div className="home-container1">
//       <Helmet>
//         <title>Dazzling Fussy Shark</title>
//         <meta property="og:title" content="Dazzling Fussy Shark" />
//       </Helmet>
//       <div className="home-navbar-container">
//         <div className="home-title-container">
//           <img alt="image" src="/meteor-200h.png" className="home-image" />
//           <span className="home-text1">Fusion Compiler</span>
//         </div>
//         <div className="home-about-us-container">
//           <button type="button" className="home-button1 button">
//             About Us
//           </button>
//         </div>
//       </div>
//       <div className="home-body-container">
//         <div className="home-text-editor-container">
//           <div className="home-container2">
//             <span className="home-text2">
//               <span>main.cpp</span>
//               <br />
//             </span>
//             <button
//               type="button"
//               className="home-button2 button"
//               onClick={handleRun}
//               disabled={loading}
//             >
//               <span>
//                 {loading ? 'Running...' : 'Run'}
//                 <br />
//               </span>
//             </button>
//           </div>
//           <div id="editor-container" className="editor-container"></div>
//         </div>
//         <div className="home-console-container">
//           <div className="home-container3">
//             <span className="home-text8">
//               <span>Output</span>
//               <br />
//             </span>
//             <button
//               type="button"
//               className="home-button3 button"
//               onClick={handleClear}
//               disabled={loading}
//             >
//               <span>
//                 {loading ? 'Clearing...' : 'Clear'}
//                 <br />
//               </span>
//             </button>
//           </div>
//           <textarea
//             id="output-textarea"
//             readOnly
//             className="home-textarea2 textarea"
//             value={outputValue}
//           ></textarea>
//           {error && <div className="error-message">{error}</div>} {/* Display error message */}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;

import React, { useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { Helmet } from 'react-helmet';
import './home.css';

const Home = () => {
  const defaultCode = `#include <iostream>

using namespace std;

int main() {
    cout << "Fusion!!" << endl;
    return 0;
}`;

  const [editorValue, setEditorValue] = useState(defaultCode);
  const [outputValue, setOutputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionID, setSessionID] = useState(null);
  const [requiresInput, setRequiresInput] = useState(false);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    const editor = monaco.editor.create(document.getElementById('editor-container'), {
      value: defaultCode,
      language: 'cpp',
      theme: 'vs-light',
      automaticLayout: true,
      lineNumbers: "on",
      selectOnLineNumbers: true,
      renderLineHighlight: "line",
      scrollBeyondLastLine: false,
    });

    editor.onDidChangeModelContent(() => {
      setEditorValue(editor.getValue());
    });

    let storedSessionID = localStorage.getItem('sessionID');
    if (!storedSessionID) {
      storedSessionID = generateSessionID();
      localStorage.setItem('sessionID', storedSessionID);
    }
    setSessionID(storedSessionID);

    return () => {
      const cleanup = async () => {
        try {
          await fetch('/api/cleanup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Session-ID': sessionID,
            },
          });
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      };

      cleanup();
    };
  }, [sessionID]);

  const handleRun = async () => {
    if (!sessionID) {
      setError('Session ID is not set.');
      return;
    }

    setLoading(true);
    setError('');
    setRequiresInput(false);
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
      setOutputValue(output);
      setRequiresInput(requiresInput);
    } catch (error) {
      console.error('Error running the code:', error);
      setError('Failed to run code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputSubmit = async () => {
    if (!sessionID) {
      setError('Session ID is not set.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Session-ID': sessionID,
        },
        body: JSON.stringify({ input: userInput }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { output } = await response.json();
      setOutputValue(prev => prev + '\n' + output);
      setUserInput('');
    } catch (error) {
      console.error('Error submitting input:', error);
      setError('Failed to submit input. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!sessionID) {
      setError('Session ID is not set.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Session-ID': sessionID,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.message === 'Output cleared') {
        setOutputValue('');
        setRequiresInput(false);
      }
    } catch (error) {
      console.error('Error clearing the output:', error);
      setError('Failed to clear output. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSessionID = () => {
    return 'sess-' + Math.random().toString(36).substr(2, 9);
  };

  return (
    <div className="home-container1">
      <Helmet>
        <title>Dazzling Fussy Shark</title>
        <meta property="og:title" content="Dazzling Fussy Shark" />
      </Helmet>
      <div className="home-navbar-container">
        <div className="home-title-container">
          <img alt="image" src="/meteor-200h.png" className="home-image" />
          <span className="home-text1">Fusion Compiler</span>
        </div>
        <div className="home-about-us-container">
          <button type="button" className="home-button1 button">
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
          <textarea
            id="output-textarea"
            readOnly
            className="home-textarea2 textarea"
            value={outputValue}
          ></textarea>
          {requiresInput && (
            <div className="input-container">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter input here"
              />
              <button onClick={handleInputSubmit} disabled={loading}>
                Submit Input
              </button>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default Home;