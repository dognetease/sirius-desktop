import 'antd/dist/antd.css';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import Comp from './demo/comp';

const hash = window.location.hash;

ReactDOM.render(<div>{hash === '#compdoc' ? <Comp /> : <App />}</div>, document.getElementById('root'));

// let main = async (a) => {
//   console.log(1212);
//   document.write(a)
// }

// main('1212vv');
