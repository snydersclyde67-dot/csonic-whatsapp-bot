module.exports = function logger(message, meta) {
  const timestamp = new Date().toISOString();
  if (meta) {
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] ${message}`, meta);
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`[${timestamp}] ${message}`);
};

