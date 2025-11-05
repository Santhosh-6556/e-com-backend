// Polyfills for Cloudflare Workers
// This file must be imported before any Mongoose imports

// Polyfill process.emitWarning for Mongoose
if (typeof process !== "undefined" && process) {
  if (!process.emitWarning) {
    process.emitWarning = function (warning, type, code, ctor) {
      // Convert warning to string if it's not already
      const warningMsg = typeof warning === "string" ? warning : String(warning);
      console.warn(`[${type || "Warning"}${code ? `: ${code}` : ""}] ${warningMsg}`);
    };
  }
  
  // Ensure process.env exists
  if (!process.env) {
    process.env = {};
  }
}

