// In Vite projects using the 'define' config for process.env, 
// we augment the global scope to ensure TypeScript recognizes the structure.
// We avoid using 'var process' directly to prevent conflicts with other type definitions (like @types/node).

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly API_KEY: string;
      readonly [key: string]: string | undefined;
    }
  }

  interface Window {
    process: {
      env: {
        readonly API_KEY: string;
        readonly [key: string]: string | undefined;
      };
    };
  }
}

export {};
