import React, { useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { Helmet } from 'react-helmet';
import './home.css';

const Home = (props) => {
  useEffect(() => {
    monaco.editor.create(document.getElementById('editor-container'), {
      value: `#include <iostream>

using namespace std;

int main() {
    cout << "Fusion" << endl;
    return 0;
}`,
      language: 'cpp',
      theme: 'vs-light', // Optional: sets a dark theme
      automaticLayout: true,
      lineNumbers: "on", // Show line numbers
      selectOnLineNumbers: true, // Allow line selection by clicking on line numbers
      renderLineHighlight: "line", // Highlight the active line
      scrollBeyondLastLine: false, // Prevent scrolling beyond the last line
      // verticalScrollbarSize: 0, // Hide vertical scrollbar initially
    });
  }, []);

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
              <br></br>
            </span>
            <button type="button" className="home-button2 button">
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
            id="2"
            readOnly="on"
            className="home-textarea2 textarea"
          ></textarea>
        </div>
      </div>
    </div>
  );
}

export default Home;
