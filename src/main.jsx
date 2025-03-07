import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Import DynamicIsland with error handling
let DynamicIsland;
try {
  DynamicIsland = require('./components/DynamicIsland').default;
  console.log('DynamicIsland loaded successfully');
} catch (error) {
  console.error('Error loading DynamicIsland:', error);
  // Fallback component in case of error
  DynamicIsland = () => <div>Error loading dynamic island component</div>;
}

// For development mode
if (document.getElementById('root')) {
  createRoot(document.getElementById('root')).render(
    <App />
  );
}

// Safe wrapper that catches errors
const SafeComponent = (Component, fallback = null) => {
  return (props) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      console.error('Error rendering component:', error);
      return fallback || <div>Error rendering component</div>;
    }
  };
}

const SafeDynamicIsland = SafeComponent(DynamicIsland);

// Create widget API
const MyWidget = {
  render: (config) => {
    try {
      console.log('MyWidget.render called with config:', config);
      const { containerId, ...otherProps } = config;
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.error(`Container with ID "${containerId}" not found.`);
        return;
      }
      
      console.log('Creating root and rendering component');
      const root = createRoot(container);
      root.render(
        <React.StrictMode>
          <SafeDynamicIsland {...otherProps} />
        </React.StrictMode>
      );
      console.log('Component rendered successfully');
    } catch (error) {
      console.error('Error in MyWidget.render:', error);
    }
  },
  version: '1.0.0' // Add a version property for debugging
};

// Export for module systems
export default MyWidget;

// For UMD build
if (typeof window !== 'undefined') {
  try {
    window.MyWidget = MyWidget;
    console.log('MyWidget attached to window successfully');
  } catch (error) {
    console.error('Error attaching MyWidget to window:', error);
  }
}