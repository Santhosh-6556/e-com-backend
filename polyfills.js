// Polyfills for Cloudflare Workers
// This file must be imported before any Mongoose imports

// IMPORTANT: Mongoose is fundamentally incompatible with Cloudflare Workers
// because MongoDB requires TCP connections which Workers don't support.
// This polyfill helps with process.emitWarning, but MongoDB connections will still fail.

// Create emitWarning function that will be attached to process
// Make it a proper function that can be called
const emitWarningFn = function (warning, type, code, ctor) {
  // Convert warning to string if it's not already
  const warningMsg = typeof warning === "string" ? warning : String(warning);
  const typeStr = type || "Warning";
  const codeStr = code ? `: ${code}` : "";
  console.warn(`[${typeStr}${codeStr}] ${warningMsg}`);
};

// Ensure emitWarningFn is a proper function (not arrow function) so it has proper 'this' binding
if (typeof emitWarningFn !== "function") {
  throw new Error("emitWarningFn must be a function");
}

// Ensure global.process exists and has emitWarning
// This is critical because Mongoose might access it via global.process
if (typeof global !== "undefined") {
  if (!global.process) {
    global.process = {
      env: {},
      emitWarning: emitWarningFn,
      exit: function (code) {
        throw new Error(`Process exit: ${code}`);
      },
    };
  } else {
    global.process.emitWarning = emitWarningFn;
  }
}

// Ensure process exists globally FIRST
if (typeof globalThis !== "undefined") {
  if (!globalThis.process) {
    globalThis.process = {
      env: {},
      emitWarning: emitWarningFn,
      exit: function (code) {
        throw new Error(`Process exit: ${code}`);
      },
    };
  } else {
    // If process exists, ensure emitWarning is set
    if (!globalThis.process.emitWarning) {
      globalThis.process.emitWarning = emitWarningFn;
    }
  }
}

// Ensure process exists (for Workers environment)
if (typeof process === "undefined") {
  // Create a minimal process object
  const processObj = {
    env: {},
    emitWarning: emitWarningFn,
    exit: function (code) {
      throw new Error(`Process exit: ${code}`);
    },
  };
  
  // Make process available globally
  if (typeof globalThis !== "undefined") {
    globalThis.process = processObj;
  }
  
  // Also try to set it in other ways
  try {
    // @ts-ignore
    global.process = processObj;
  } catch (e) {}
} else {
  // Process exists - ensure emitWarning is always available
  if (!process.env) {
    process.env = {};
  }
  
  // Always set emitWarning - even if it exists, override it to ensure it's callable
  try {
    // Try to define it as a property first
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
  
  // Also ensure it's on globalThis.process if that exists
  if (typeof globalThis !== "undefined" && globalThis.process) {
    globalThis.process.emitWarning = emitWarningFn;
  }
}

// Final check: ensure emitWarning exists on any process-like object
if (typeof process !== "undefined" && process) {
  if (typeof process.emitWarning !== "function") {
    process.emitWarning = emitWarningFn;
  }
}

// CRITICAL: Force emitWarning to be available on process immediately
// This ensures Mongoose can access it even if it cached a reference
// Also ensure it's available via different access patterns Mongoose might use
(function() {
  'use strict';
  
  // Get all possible process references
  const processRefs = [];
  
  if (typeof process !== "undefined") processRefs.push(process);
  if (typeof global !== "undefined" && global.process) processRefs.push(global.process);
  if (typeof globalThis !== "undefined" && globalThis.process) processRefs.push(globalThis.process);
  
  // Set emitWarning on all process references
  processRefs.forEach(proc => {
    if (proc) {
      // Force set emitWarning - use multiple methods to ensure it sticks
      proc.emitWarning = emitWarningFn;
      
      // Also try to set it via defineProperty
      try {
        Object.defineProperty(proc, 'emitWarning', {
          value: emitWarningFn,
          writable: true,
          enumerable: true,
          configurable: true
        });
      } catch (e) {
        // If that fails, just assign directly
        proc.emitWarning = emitWarningFn;
      }
      
      // Verify it's set
      if (typeof proc.emitWarning !== "function") {
        // Last resort: assign directly
        proc.emitWarning = emitWarningFn;
      }
    }
  });
  
  // Also ensure global.process exists if Mongoose accesses it that way
  if (typeof global !== "undefined") {
    if (!global.process) {
      global.process = typeof process !== "undefined" ? process : {
        env: {},
        emitWarning: emitWarningFn,
        exit: function (code) {
          throw new Error(`Process exit: ${code}`);
        },
      };
    }
    // Ensure emitWarning is on global.process
    global.process.emitWarning = emitWarningFn;
  }
})();

