function emitWarningFn(warning, type, code, ctor) {
  const warningMsg = typeof warning === "string" ? warning : String(warning);
  const typeStr = type || "Warning";
  const codeStr = code ? `: ${code}` : "";
  console.warn(`[${typeStr}${codeStr}] ${warningMsg}`);
}

if (typeof process !== "undefined") {
  try {
    Object.defineProperty(process, "emitWarning", {
      value: emitWarningFn,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  } catch (e) {
    process.emitWarning = emitWarningFn;
  }

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
  const processObj = {
    env: {},
    emitWarning: emitWarningFn,
    exit: function (code) {
      throw new Error(`Process exit: ${code}`);
    },
  };

  try {
    global.process = processObj;
    globalThis.process = processObj;
  } catch (e) {}
}

(function () {
  "use strict";

  const refs = [];

  if (typeof process !== "undefined") refs.push(process);
  if (typeof global !== "undefined" && global.process)
    refs.push(global.process);
  if (typeof globalThis !== "undefined" && globalThis.process)
    refs.push(globalThis.process);

  refs.forEach((proc) => {
    if (proc && typeof proc === "object") {
      proc.emitWarning = emitWarningFn;

      try {
        Object.defineProperty(proc, "emitWarning", {
          value: emitWarningFn,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } catch (e) {
        proc.emitWarning = emitWarningFn;
      }
    }
  });
})();
