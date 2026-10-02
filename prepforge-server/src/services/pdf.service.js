/**
 * PDF Service (Puppeteer-based)
 * Generates a professional PDF progress report by rendering HTML headlessly.
 * Deferred until Phase 6 — Puppeteer will be installed then.
 * This stub exposes the correct interface so controllers can reference it now.
 */

const generatePDFReport = async (userData) => {
  // Phase 6: Full Puppeteer implementation will render dashboard HTML → PDF
  // For now, throw a descriptive error if called before implementation
  throw new Error(
    'PDF generation requires Puppeteer. This feature will be implemented in Phase 6.'
  );
};

module.exports = { generatePDFReport };
