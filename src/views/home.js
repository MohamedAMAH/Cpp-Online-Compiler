import React, { useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { Helmet } from 'react-helmet';
import './home.css';

const Home = (props) => {
  const [editorValue, setEditorValue] = useState('');
  const [outputValue, setOutputValue] = useState('');

  useEffect(() => {
    const editor = monaco.editor.create(document.getElementById('editor-container'), {
      value: `#include <iostream>

using namespace std;

int main() {
    cout << "Fusion" << endl;
    return 0;
}`,
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
  }, []);

  const handleRun = async () => {
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: editorValue }),
      });
      const { output } = await response.json();
      setOutputValue(output);
    } catch (error) {
      console.error('Error running the code:', error);
    }
  };

  return (
    <div className="home-container1">
      <Helmet>
        <title>Dazzling Fussy Shark</title>
        <meta property="og:title" content="Dazzling Fussy Shark" />
      </Helmet>
      <div className="home-navbar-container">
        {/* ... */}
      </div>
      <div className="home-body-container">
        <div className="home-text-editor-container">
          <div className="home-container2">
            <span className="home-text2">
              <span>main.cpp</span>
              <br></br>
            </span>
            <button type="button" className="home-button2 button" onClick={handleRun}>
              <span>
                <span>Run</span>
                <br></br>
              </span>
            </button>
          </div>
          <div id="editor-container" className="editor-container"></div>
        </div>
        <div className="home-console-container">
          <div className="home-container3">
            <span className="home-text8">Output</span>
          </div>
          <textarea
            id="output-textarea"
            readOnly="on"
            className="home-textarea2 textarea"
            value={outputValue}
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default Home;