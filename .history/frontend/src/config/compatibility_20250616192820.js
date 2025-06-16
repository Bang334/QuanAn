import React from 'react';
if (React.version.startsWith('19')) {
  Object.defineProperty(React, 'version', {
    get: () => '18.2.0'
  });
}

export default {}; 