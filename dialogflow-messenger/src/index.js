import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

let interval = setInterval(() => {
  const messengerDivs = document.querySelectorAll('df-messenger')
  if (messengerDivs.length) clearInterval(interval);

  messengerDivs.forEach(Div =>  {
    ReactDOM.render(
      <React.StrictMode>
        <App domElement={Div} />
      </React.StrictMode>,
      Div
    );
  })
}, 100); // check every 100ms
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
