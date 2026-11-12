/** 类型声明:pdf-parse(无官方类型) */
declare module 'pdf-parse' {
  interface PdfParseResult {
    numpages: number
    numrender: number
    info: unknown
    metadata: unknown
    version: string
    text: string
  }
  function pdfParse(dataBuffer: Buffer, options?: unknown): Promise<PdfParseResult>
  export default pdfParse
}