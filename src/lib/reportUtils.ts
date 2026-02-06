import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Downloads a multi-page PDF report by capturing each page element separately
 * @param baseElementId - Base ID for report pages (e.g., "estimation-report")
 * @param fileName - Name of the PDF file to download
 */
export const downloadPDF = async (baseElementId: string, fileName: string) => {
    try {
        // A4 Paper Size in mm (Landscape)
        const pdfWidth = 297;
        const pdfHeight = 210;

        const pdf = new jsPDF('l', 'mm', 'a4');

        // Capture Page 1
        const page1Element = document.getElementById(`${baseElementId}-page-1`);
        if (!page1Element) {
            throw new Error('Report page 1 element not found');
        }

        const page1ImgData = await toPng(page1Element, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            cacheBust: true
        });

        // Add page 1 - fit to page width
        pdf.addImage(page1ImgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        // Capture Page 2
        const page2Element = document.getElementById(`${baseElementId}-page-2`);
        if (page2Element) {
            const page2ImgData = await toPng(page2Element, {
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                cacheBust: true
            });

            pdf.addPage();
            // Add page 2 - fit to page width
            pdf.addImage(page2ImgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        }

        // Download the PDF
        pdf.save(fileName);
    } catch (error) {
        console.error('PDF generation failed:', error);
        alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
        throw error;
    }
};
