import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export const downloadPDF = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element not found: ${elementId}`);
        return;
    }

    try {
        // Use html-to-image for better compatibility with modern CSS
        const imgData = await toPng(element, {
            backgroundColor: '#ffffff',
            cacheBust: true,
            pixelRatio: 2 // High quality
        });

        // A4 Paper Size in mm (Portrait)
        const pdfWidth = 210;
        const pdfHeight = 297;

        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgProps = (pdf as any).getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = imgHeight;
        let position = 0;

        // First page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Multi-page handling (if content is long)
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(fileName);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        alert('리포트 생성 중 오류가 발생했습니다. (Unsupported CSS Syntax)');
    }
};
