// // TerminalComponent.js
// import React, { useEffect, useRef } from 'react';
// import { Terminal } from 'xterm';
// import 'xterm/css/xterm.css';

// const TerminalComponent = ({ output }) => {
//   const terminalRef = useRef(null);

//   useEffect(() => {
//     const terminal = new Terminal();
//     terminal.open(terminalRef.current);
//     terminal.writeln(output);

//     return () => terminal.dispose();
//   }, [output]);

//   return <div ref={terminalRef} style={{ height: '400px', width: '100%' }} />;
// };

// export default TerminalComponent;
