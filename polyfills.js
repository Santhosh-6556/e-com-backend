// Polyfills for Cloudflare Workers
// This file must be imported before any Mongoose imports

// IMPORTANT: Mongoose is fundamentally incompatible with Cloudflare Workers
// because MongoDB requires TCP connections which Workers don't support.
// This polyfill helps with process.emitWarning, but MongoDB connections will still fail.

// CRITICAL: Set up process.emitWarning IMMEDIATELY at the top level
// Mongoose's browser bundle accesses process.emitWarning during module loading
// The error "{(intermediate value)}.emitWarning is not a function" suggests
// Mongoose is doing something like (process || {}).emitWarning(), so we need
// to ensure process exists and has emitWarning BEFORE any Mongoose code runs

// Create emitWarning function - must be a function declaration (hoisted)
function emitWarningFn(warning, type, code, ctor) {
  // Convert warning to string if it's not already
  const warningMsg = typeof warning === "string" ? warning : String(warning);
  const typeStr = type || "Warning";
  const codeStr = code ? `: ${code}` : "";
  console.warn(`[${typeStr}${codeStr}] ${warningMsg}`);
}

// IMMEDIATELY set up process.emitWarning - this must happen synchronously
// before any imports that might load Mongoose

// If process exists (from nodejs_compat), ensure it has emitWarning
if (typeof process !== "undefined") {
  // Force set emitWarning on the existing process object
  try {
    Object.defineProperty(process, 'emitWarning', {
      value: emitWarningFn,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } catch (e) {
    // Fallback: direct assignment
    process.emitWarning = emitWarningFn;
  }
  
  // Also ensure it's available via global references
  if (typeof global !== "undefined") {
    if (!global.process) {
      global.process = process;
    } else {
      global.process.emitWarning = emitWarningFn;
    }
  }
  
  if (typeof globalThis !== "undefined") {
    if (!globalThis.process) {
      globalThis.process = process;
    } else {
      globalThis.process.emitWarning = emitWarningFn;
    }
  }
} else {
  // Process doesn't exist - create it
  const processObj = {
    env: {},
    emitWarning: emitWarningFn,
    exit: function (code) {
      throw new Error(`Process exit: ${code}`);
    },
  };
  
  // Try to make process available globally
  try {
    // @ts-ignore
    global.process = processObj;
    // @ts-ignore
    globalThis.process = processObj;
  } catch (e) {
    // Ignore errors
  }
}

// Final verification and force-set
// This ensures emitWarning is available even if Mongoose accesses process in unusual ways
(function() {
  'use strict';
  
  // Get all possible process references
  const refs = [];
  
  if (typeof process !== "undefined") refs.push(process);
  if (typeof global !== "undefined" && global.process) refs.push(global.process);
  if (typeof globalThis !== "undefined" && globalThis.process) refs.push(globalThis.process);
  
  // Set emitWarning on all references
  refs.forEach(proc => {
    if (proc && typeof proc === "object") {
      proc.emitWarning = emitWarningFn;
      
      // Also try defineProperty
      try {
        Object.defineProperty(proc, 'emitWarning', {
          value: emitWarningFn,
          writable: true,
          enumerable: true,
          configurable: true
        });
      } catch (e) {
        proc.emitWarning = emitWarningFn;
      }
    }
  });
})();
