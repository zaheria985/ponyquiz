declare module "mammoth" {
  interface ConversionResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  function extractRawText(options: { buffer: Buffer }): Promise<ConversionResult>;
  function convertToHtml(options: { buffer: Buffer }): Promise<ConversionResult>;
}
