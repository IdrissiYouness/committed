import '@testing-library/jest-dom';
import React from 'react';

// Make React available globally in all test files so JSX transforms work
// without needing `import React from 'react'` in every test file.
globalThis.React = React;