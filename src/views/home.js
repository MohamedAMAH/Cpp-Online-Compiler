import React, { useEffect, useState, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { Helmet } from 'react-helmet';
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
    return 0;
}`;

  const [editorValue, setEditorValue] = useState(defaultCode);
  const [outputValue, setOutputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionID, setSessionID] = useState(null);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [inputStartIndex, setInputStartIndex] = useState(0);
  const textareaRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState(0);

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
      console.log(newSessionID)
      setSessionID(newSessionID);
    }

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

  useEffect(() => {
    if (isWaitingForInput && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(outputValue.length, outputValue.length);
    }
  }, [isWaitingForInput, outputValue]);

  const handleRun = async () => {
    if (!sessionID) {
      setError('Session ID is not set.');
      return;
    }

    setLoading(true);
    setError('');
    setIsWaitingForInput(false);
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
      // setInputStartIndex(output.length); // Track where the input should start
      setInputStartIndex(output.length);
      setIsWaitingForInput(requiresInput); // Use the requiresInput flag to determine if we need input
    } catch (error) {
      console.error('Error running the code:', error);
      setError('Failed to run code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // const handleKeyDown = (event) => {
  //   if (isWaitingForInput) {
  //     // const currentCursorPosition = event.target.selectionStart;
  //     if (event.key === 'Enter') {
  //       // event.preventDefault();
  //       const input = event.target.value.slice(inputStartIndex).trim();
  //       if (input.length >= 0) {
  //         handleInput(input);
  //       }
  //     }
  //   }
  // };

  // const handleChange = (e) => {
  //   console.log('Textarea changed:', e.target.value);
  //   if (isWaitingForInput) {
  //     const newValue = e.target.value;
  //     const currentCursorPosition = e.target.selectionStart;
  //     console.log('Current cursor position:', currentCursorPosition);
  
  //     if (currentCursorPosition < inputStartIndex) {
  //       e.target.value = outputValue;
  //     } else {
  //       setOutputValue(newValue);
  //     }
  //   }
  // };

  // const handleKeyDown = (event) => {
  //   if (isWaitingForInput && event.key === 'Enter') {
  //     const input = outputValue.slice(inputStartIndex).trim();
  //     if (input.length > 0) {
  //       handleInput(input);
  //     }
  //   } else if(isWaitingForInput && event.key === 'Enter') {

  //   }
  // };

  const handleKeyDown = (e) => {
    if (isWaitingForInput) {
      const currentCursorPosition = e.target.selectionStart;
  
      if (e.key === 'Enter') {
        const input = outputValue.slice(inputStartIndex).trim();
        if (input.length > 0) {
          handleInput(input);
        }
      } else if (e.key === 'Backspace') {
        if (currentCursorPosition <= inputStartIndex) {
          console.log('cursor: ', currentCursorPosition);
          console.log('input: ', inputStartIndex);
          e.preventDefault();
        }
      }
    }
  };

  const handleChange = (e) => {
    console.log('Textarea changed:', e.target.value);
    setOutputValue(e.target.value);
    console.log('cursor: ', e.target.selectionEnd);
    console.log('input: ', inputStartIndex);
  };

  // const handleInput = async (input) => {
  //   if (!sessionID) {
  //     setError('Session ID is not set.');
  //     return;
  //   }

  //   setLoading(true);
  //   setError('');
  //   try {
  //     const response = await fetch('/api/input', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Session-ID': sessionID,
  //       },
  //       body: JSON.stringify({ input }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Network response was not ok');
  //     }

  //     const { output, requiresInput } = await response.json();
  //     if(requiresInput) {
  //       // setOutputValue(prevOutput => prevOutput + output);
  //       // setInputStartIndex(prev => prev + output.length);
  //       // setIsWaitingForInput(requiresInput);
  //       // setOutputValue(prevOutput => {
  //       //   // Remove the input from the previous output
  //       //   const outputWithoutInput = prevOutput.slice(0, inputStartIndex);
  //       //   // Concatenate the previous output (without input) with the new output
  //       //   return outputWithoutInput + output;
  //       // });
  //       // setOutputValue(output);
  //       // setInputStartIndex(100); // Update the index after new output
  //       // setInputStartIndex(prev => prev + output.length); // Update the index after new output
  //       setOutputValue(prevOutput => prevOutput + output);
  //       setInputStartIndex(prev => prev + output.length); // Update the index after new output
  //       // setIsWaitingForInput(requiresInput); // Update based on response
  //       console.log('yo: ', requiresInput);
  //       setIsWaitingForInput(requiresInput); // Update based on response
  //     } else {
  //       setOutputValue(output);
  //       setInputStartIndex(output.length); // Update the index after input and output
  //       setIsWaitingForInput(requiresInput); // Update based on response
  //     }
      
  //   } catch (error) {
  //     console.error('Error submitting input:', error);
  //     setError('Failed to submit input. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleInput = async (input) => {
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
        body: JSON.stringify({ input }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const { output, requiresInput } = await response.json();
      // Update output directly with what backend returns, without appending input manually
      // setOutputValue(prev => prev + output);
      // setInputStartIndex(prev => prev + output.length); // Update the index after new output
      // setIsWaitingForInput(requiresInput); // Update based on response

      // Preserve everything before inputStartIndex (previous output), and append the new output
      const cleanedOutput = outputValue.slice(0, inputStartIndex) + output;
      // const cleanedOutput = output;
      // setOutputValue('');
      // Update the output value to reflect this cleaned output
      setOutputValue(cleanedOutput);
      console.log('Output: ', cleanedOutput);

      // setInputStartIndex(0);
      // Move the input start index to the end of the new output
      setInputStartIndex(cleanedOutput.length - 2);
      console.log('input ybd2 hena: ', cleanedOutput.length);
      console.log('input: ', inputStartIndex);
      console.log('el new: ', cursorPosition);
      // setTimeout(() => {
      //   textareaRef.current.setSelectionRange(cleanedOutput.length, cleanedOutput.length);
      //   console.log('Updated cursor position: ', textareaRef.current.selectionStart);
      // }, 1000);
      setIsWaitingForInput(requiresInput); // Update based on backend response
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
        setIsWaitingForInput(false);
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
          <textarea
            ref={textareaRef}
            className="home-textarea2 textarea"
            value={outputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            readOnly={!isWaitingForInput}
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default Home;
