// This file provides compatibility fixes for React 19 with Ant Design 5.x
import React from 'react';

// Override React.version to make Ant Design think it's running with React 18
// This is a temporary fix until Ant Design officially supports React 19
if (React.version.startsWith('19')) {
  Object.defineProperty(React, 'version', {
    get: () => '18.2.0'
  });
  console.log('Applied React compatibility patch for Ant Design');
}

export default {}; 