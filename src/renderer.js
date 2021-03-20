import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';

import PageContainer from './nf_page';

console.log("Renderer started.");

var args=window.process.argv.slice(-2);
console.log("args",args);
var page=args[0];
var params=args[1];

ReactDOM.render(<PageContainer page={page} page_params={params} page_group="desktop"/>, document.getElementById('root'));
