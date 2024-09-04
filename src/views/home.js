// import React, { useEffect, useState, useRef } from 'react';
// import * as monaco from 'monaco-editor';
// import { Helmet } from 'react-helmet';
// import './home.css';

// const Home = () => {
//   const defaultCode = `#include <iostream>

// int main() {
//     std::string userInput;
//     std::cout << "Enter something: ";
//     std::getline(std::cin, userInput);
//     std::cout << "You entered: " << userInput << std::endl;
//     std::string userInput2;
//     std::cout << "Enter something2: ";
//     std::getline(std::cin, userInput2);
//     std::cout << "You entered: " << userInput2 << std::endl;
//     std::string userInput3;
//     std::cout << "Enter something3: ";
//     std::getline(std::cin, userInput3);
//     std::cout << "You entered: " << userInput3 << std::endl;
//     return 0;
// }`;

//   const [editorValue, setEditorValue] = useState(defaultCode);
//   const [outputValue, setOutputValue] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [sessionID, setSessionID] = useState(null);
//   const [isWaitingForInput, setIsWaitingForInput] = useState(false);
//   const [inputStartIndex, setInputStartIndex] = useState(0);
//   const textareaRef = useRef(null);
//   const [cursorPosition, setCursorPosition] = useState(0);

//   useEffect(() => {
//     const editor = monaco.editor.create(document.getElementById('editor-container'), {
//       value: defaultCode,
//       language: 'cpp',
//       theme: 'vs-light',
//       automaticLayout: true,
//       lineNumbers: "on",
//       selectOnLineNumbers: true,
//       renderLineHighlight: "line",
//       scrollBeyondLastLine: false,
//       readOnly: false
//     });

//     editor.onDidChangeModelContent(() => {
//       setEditorValue(editor.getValue());
//     });

//     if (!sessionID) {
//       const newSessionID = generateSessionID();
//       console.log(newSessionID)
//       setSessionID(newSessionID);
//     }

//     return () => {
//       const cleanup = async () => {
//         try {
//           await fetch('/api/cleanup', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Session-ID': sessionID,
//             },
//           });
//         } catch (error) {
//           console.error('Error during cleanup:', error);
//         }
//       };

//       cleanup();
//     };
//   }, [sessionID]);

//   useEffect(() => {
//     if (isWaitingForInput && textareaRef.current) {
//       textareaRef.current.focus();
//       textareaRef.current.setSelectionRange(outputValue.length, outputValue.length);
//     }
//   }, [isWaitingForInput, outputValue]);

//   const handleRun = async () => {
//     if (!sessionID) {
//       setError('Session ID is not set.');
//       return;
//     }

//     setLoading(true);
//     setError('');
//     setIsWaitingForInput(false);
//     try {
//       const response = await fetch('/api/run', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Session-ID': sessionID,
//         },
//         body: JSON.stringify({ code: editorValue }),
//       });

//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }

//       const { output, requiresInput } = await response.json();
//       setOutputValue(output);
//       // setInputStartIndex(output.length); // Track where the input should start
//       setInputStartIndex(output.length);
//       setIsWaitingForInput(requiresInput); // Use the requiresInput flag to determine if we need input
//     } catch (error) {
//       console.error('Error running the code:', error);
//       setError('Failed to run code. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const handleKeyDown = (event) => {
//   //   if (isWaitingForInput) {
//   //     // const currentCursorPosition = event.target.selectionStart;
//   //     if (event.key === 'Enter') {
//   //       // event.preventDefault();
//   //       const input = event.target.value.slice(inputStartIndex).trim();
//   //       if (input.length >= 0) {
//   //         handleInput(input);
//   //       }
//   //     }
//   //   }
//   // };

//   // const handleChange = (e) => {
//   //   console.log('Textarea changed:', e.target.value);
//   //   if (isWaitingForInput) {
//   //     const newValue = e.target.value;
//   //     const currentCursorPosition = e.target.selectionStart;
//   //     console.log('Current cursor position:', currentCursorPosition);
  
//   //     if (currentCursorPosition < inputStartIndex) {
//   //       e.target.value = outputValue;
//   //     } else {
//   //       setOutputValue(newValue);
//   //     }
//   //   }
//   // };

//   // const handleKeyDown = (event) => {
//   //   if (isWaitingForInput && event.key === 'Enter') {
//   //     const input = outputValue.slice(inputStartIndex).trim();
//   //     if (input.length > 0) {
//   //       handleInput(input);
//   //     }
//   //   } else if(isWaitingForInput && event.key === 'Enter') {

//   //   }
//   // };

//   const handleKeyDown = (e) => {
//     if (isWaitingForInput) {
//       const currentCursorPosition = e.target.selectionStart;
  
//       if (e.key === 'Enter') {
//         const input = outputValue.slice(inputStartIndex).trim();
//         if (input.length > 0) {
//           handleInput(input);
//         }
//       } else if (e.key === 'Backspace') {
//         if (currentCursorPosition <= inputStartIndex) {
//           console.log('cursor: ', currentCursorPosition);
//           console.log('input: ', inputStartIndex);
//           e.preventDefault();
//         }
//       }
//     }
//   };

//   const handleChange = (e) => {
//     console.log('Textarea changed:', e.target.value);
//     setOutputValue(e.target.value);
//     console.log('cursor: ', e.target.selectionEnd);
//     console.log('input: ', inputStartIndex);
//   };

//   // const handleInput = async (input) => {
//   //   if (!sessionID) {
//   //     setError('Session ID is not set.');
//   //     return;
//   //   }

//   //   setLoading(true);
//   //   setError('');
//   //   try {
//   //     const response = await fetch('/api/input', {
//   //       method: 'POST',
//   //       headers: {
//   //         'Content-Type': 'application/json',
//   //         'Session-ID': sessionID,
//   //       },
//   //       body: JSON.stringify({ input }),
//   //     });

//   //     if (!response.ok) {
//   //       throw new Error('Network response was not ok');
//   //     }

//   //     const { output, requiresInput } = await response.json();
//   //     if(requiresInput) {
//   //       // setOutputValue(prevOutput => prevOutput + output);
//   //       // setInputStartIndex(prev => prev + output.length);
//   //       // setIsWaitingForInput(requiresInput);
//   //       // setOutputValue(prevOutput => {
//   //       //   // Remove the input from the previous output
//   //       //   const outputWithoutInput = prevOutput.slice(0, inputStartIndex);
//   //       //   // Concatenate the previous output (without input) with the new output
//   //       //   return outputWithoutInput + output;
//   //       // });
//   //       // setOutputValue(output);
//   //       // setInputStartIndex(100); // Update the index after new output
//   //       // setInputStartIndex(prev => prev + output.length); // Update the index after new output
//   //       setOutputValue(prevOutput => prevOutput + output);
//   //       setInputStartIndex(prev => prev + output.length); // Update the index after new output
//   //       // setIsWaitingForInput(requiresInput); // Update based on response
//   //       console.log('yo: ', requiresInput);
//   //       setIsWaitingForInput(requiresInput); // Update based on response
//   //     } else {
//   //       setOutputValue(output);
//   //       setInputStartIndex(output.length); // Update the index after input and output
//   //       setIsWaitingForInput(requiresInput); // Update based on response
//   //     }
      
//   //   } catch (error) {
//   //     console.error('Error submitting input:', error);
//   //     setError('Failed to submit input. Please try again.');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const handleInput = async (input) => {
//     if (!sessionID) {
//       setError('Session ID is not set.');
//       return;
//     }
  
//     setLoading(true);
//     setError('');
//     try {
//       const response = await fetch('/api/input', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Session-ID': sessionID,
//         },
//         body: JSON.stringify({ input }),
//       });
  
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
  
//       const { output, requiresInput } = await response.json();
//       // Update output directly with what backend returns, without appending input manually
//       // setOutputValue(prev => prev + output);
//       // setInputStartIndex(prev => prev + output.length); // Update the index after new output
//       // setIsWaitingForInput(requiresInput); // Update based on response

//       // Preserve everything before inputStartIndex (previous output), and append the new output
//       const cleanedOutput = outputValue.slice(0, inputStartIndex) + output;
//       // const cleanedOutput = output;
//       // setOutputValue('');
//       // Update the output value to reflect this cleaned output
//       setOutputValue(cleanedOutput);
//       console.log('Output: ', cleanedOutput);

//       // setInputStartIndex(0);
//       // Move the input start index to the end of the new output
//       setInputStartIndex(cleanedOutput.length - 2);
//       console.log('input ybd2 hena: ', cleanedOutput.length);
//       console.log('input: ', inputStartIndex);
//       console.log('el new: ', cursorPosition);
//       // setTimeout(() => {
//       //   textareaRef.current.setSelectionRange(cleanedOutput.length, cleanedOutput.length);
//       //   console.log('Updated cursor position: ', textareaRef.current.selectionStart);
//       // }, 1000);
//       setIsWaitingForInput(requiresInput); // Update based on backend response
//     } catch (error) {
//       console.error('Error submitting input:', error);
//       setError('Failed to submit input. Please try again.');
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
//           'Session-ID': sessionID,
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }

//       const data = await response.json();
//       if (data.message === 'Output cleared') {
//         setOutputValue('');
//         setIsWaitingForInput(false);
//       }
//     } catch (error) {
//       console.error('Error clearing the output:', error);
//       setError('Failed to clear output. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generateSessionID = () => {
//     return 'sess-' + Math.random().toString(36).substr(2, 9);
//   };

//   return (
//     <div className="home-container1">
//       <Helmet>
//         <title>Fusion Compiler</title>
//         <meta property="og:title" content="Fusion Compiler" />
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
//             ref={textareaRef}
//             className="home-textarea2 textarea"
//             value={outputValue}
//             onChange={handleChange}
//             onKeyDown={handleKeyDown}
//             readOnly={!isWaitingForInput}
//           ></textarea>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;

// import React, { useEffect, useState } from 'react';
// import * as monaco from 'monaco-editor';
// import { Helmet } from 'react-helmet';
// import CustomTerminal from './CustomTerminal';
// import './home.css';

// const Home = () => {
//   const defaultCode = `#include <iostream>

// int main() {
//     std::string userInput;
//     std::cout << "Enter something: ";
//     std::getline(std::cin, userInput);
//     std::cout << "You entered: " << userInput << std::endl;
//     std::string userInput2;
//     std::cout << "Enter something2: ";
//     std::getline(std::cin, userInput2);
//     std::cout << "You entered: " << userInput2 << std::endl;
//     std::string userInput3;
//     std::cout << "Enter something3: ";
//     std::getline(std::cin, userInput3);
//     std::cout << "You entered: " << userInput3 << std::endl;
//     return 0;
// }`;

//   const [editorValue, setEditorValue] = useState(defaultCode);
//   const [terminalOutput, setTerminalOutput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [sessionID, setSessionID] = useState(null);
//   const [isWaitingForInput, setIsWaitingForInput] = useState(false);

//   useEffect(() => {
//     const editor = monaco.editor.create(document.getElementById('editor-container'), {
//       value: defaultCode,
//       language: 'cpp',
//       theme: 'vs-light',
//       automaticLayout: true,
//       lineNumbers: "on",
//       selectOnLineNumbers: true,
//       renderLineHighlight: "line",
//       scrollBeyondLastLine: false,
//       readOnly: false
//     });

//     editor.onDidChangeModelContent(() => {
//       setEditorValue(editor.getValue());
//     });

//     if (!sessionID) {
//       const newSessionID = generateSessionID();
//       setSessionID(newSessionID);
//     }

//     return () => {
//       const cleanup = async () => {
//         try {
//           await fetch('/api/cleanup', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Session-ID': sessionID,
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
//     setTerminalOutput('');  // Clear previous output
//     try {
//       const response = await fetch('/api/run', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Session-ID': sessionID,
//         },
//         body: JSON.stringify({ code: editorValue }),
//       });
  
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
  
//       const { output, requiresInput } = await response.json();
//       setTerminalOutput(output);
//       setIsWaitingForInput(requiresInput);
//     } catch (error) {
//       console.error('Error running the code:', error);
//       setError('Failed to run code. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInput = async (input) => {
//     if (!sessionID) {
//       setError('Session ID is not set.');
//       return;
//     }

//     setLoading(true);
//     setError('');
//     try {
//       const response = await fetch('/api/input', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Session-ID': sessionID,
//         },
//         body: JSON.stringify({ input }),
//       });

//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }

//       const { output, requiresInput } = await response.json();
//       setTerminalOutput(prevOutput => prevOutput + output);
//       setIsWaitingForInput(requiresInput);
//     } catch (error) {
//       console.error('Error submitting input:', error);
//       setError('Failed to submit input. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClear = () => {
//     setTerminalOutput('');
//     setIsWaitingForInput(false);
//   };

//   const generateSessionID = () => {
//     return 'sess-' + Math.random().toString(36).substr(2, 9);
//   };

//   return (
//     <div className="home-container1">
//       <Helmet>
//         <title>Fusion Compiler</title>
//         <meta property="og:title" content="Fusion Compiler" />
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
//           <CustomTerminal 
//             onInput={handleInput} 
//             output={terminalOutput} 
//             isWaitingForInput={isWaitingForInput}
//           />
//         </div>
//       </div>
//       {error && <div className="error-message">{error}</div>}
//     </div>
//   );
// };

// export default Home;

import React, { useEffect, useState, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Helmet } from 'react-helmet';
import 'xterm/css/xterm.css';
import './home.css';

const Home = () => {
  const defaultCode = `#include <iostream>

int main() {
    std::string userInput;
    std::cout << "Enter something: ";
    std::getline(std::cin, userInput);
    std::cout << "You entered: " << userInput << std::endl;
    std::string userInput2;
    std::cout << "Enter something2: ";
    std::getline(std::cin, userInput2);
    std::cout << "You entered: " << userInput2 << std::endl;
    std::string userInput3;
    std::cout << "Enter something3: ";
    std::getline(std::cin, userInput3);
    std::cout << "You entered: " << userInput3 << std::endl;
    std::string userInput4;
    std::cout << "Enter something4: ";
    std::getline(std::cin, userInput4);
    std::cout << "You entered: " << userInput4 << std::endl;
    return 0;
}`;

// const defaultCode = `#include <iostream>
// #include <string>

// int main() {
//     // Variables for different types of inputs
//     int integerInput;
//     double doubleInput;
//     char charInput;
//     std::string stringInput;

//     // Prompt user for integer input
//     std::cout << "Enter an integer: ";
//     std::cin >> integerInput;

//     // Prompt user for double input
//     std::cout << "Enter a double: ";
//     std::cin >> doubleInput;

//     // Prompt user for character input
//     std::cout << "Enter a character: ";
//     std::cin >> charInput;

//     // Prompt user for string input
//     std::cout << "Enter a string: ";
//     std::getline(std::cin, stringInput);

//     // Display the inputs
//     std::cout << "You entered:\n";
//     std::cout << "Integer: " << integerInput << "\n";
//     std::cout << "Double: " << doubleInput << "\n";
//     std::cout << "Character: " << charInput << "\n";
//     std::cout << "String: " << stringInput << "\n";

//     return 0;
// }`;

  const [editorValue, setEditorValue] = useState(defaultCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionID, setSessionID] = useState(null);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const terminalRef = useRef(null);
  const terminalContainerRef = useRef(null);
  const inputBufferRef = useRef('');
  const [triggerEffect, setTriggerEffect] = useState(false);
  const isWaitingForInputRef = useRef(false);

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
      readOnly: false
    });

    editor.onDidChangeModelContent(() => {
      setEditorValue(editor.getValue());
    });

    if (!sessionID) {
      const newSessionID = generateSessionID();
      setSessionID(newSessionID);
    }

    // Initialize xterm
    const term = new Terminal({
      fontFamily: '"Courier New", monospace',
      fontSize: 16,
      cursorBlink: true,
      theme: {
        background: '#444444'
      }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainerRef.current);
    fitAddon.fit();
    terminalRef.current = term;

    term.onKey(({ key, domEvent }) => {
      if (isWaitingForInputRef.current) {
        if (domEvent.ctrlKey) {
          // Allow Ctrl+C, Ctrl+V, etc. for default behavior
          term.write(domEvent.key);
        }
        // const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey && !domEvent
        if (domEvent.keyCode === 13) { // Enter key
          const input = inputBufferRef.current;
          inputBufferRef.current = '';
          term.write('\r\n');
          handleInput(input);
        } else if (domEvent.keyCode === 8) { // Backspace
          if (inputBufferRef.current.length > 0) {
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
            term.write('\b \b');
          }
        } else if(domEvent.keyCode == 38 || domEvent.keyCode == 40 || domEvent.keyCode == 37 || domEvent.keyCode == 39) {
            console.log('lol');
        } else {
          inputBufferRef.current += key;
          term.write(key);
        }
      }
    });

    return () => {
      editor.dispose();
      term.dispose();
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
      // cleanup();
    };
  }, [sessionID]);

  useEffect(() => {
    console.log('isWaitingForInput:', isWaitingForInput);
  }, [isWaitingForInput, triggerEffect]);

  const handleRun = async () => {
    if (!sessionID) {
      setError('Session ID is not set.');
      return;
    }

    setLoading(true);
    setError('');
    setIsWaitingForInput(false);
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
      console.log('Terminal ref:', terminalRef.current);
      if (terminalRef.current) {
        terminalRef.current.write(output);
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
    setIsWaitingForInput(false);
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
          console.log('nigga');
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
      terminalRef.current.clear();
    }
  };

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
          <div ref={terminalContainerRef} className="terminal-container"></div>
        </div>
      </div>
    </div>
  );
};

export default Home;