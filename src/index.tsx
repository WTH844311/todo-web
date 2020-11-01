import  "react-app-polyfill/ie11";
import  "react-app-polyfill/stable";
import 'antd/dist/antd.css'
import './style/index.css'
import './style/antd.css'
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router } from 'react-router-dom'
import App from './pages/app'

ReactDOM.render(<Router><App/></Router>, document.getElementById('root'));