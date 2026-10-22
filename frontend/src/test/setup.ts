import '@testing-library/jest-dom';

// Polyfills or test environment helpers if needed
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
  if (!navigator.clipboard) {
    Object.assign(navigator, {
      clipboard: {
        writeText: async () => undefined,
      },
    });
  }
}
