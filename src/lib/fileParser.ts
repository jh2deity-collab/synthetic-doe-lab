import * as XLSX from 'xlsx';

/**
 * Parses an uploaded file (CSV, Excel, TXT) and returns a comma-separated string of extracted numbers.
 * - Excel/CSV: Reads the first sheet. Extracts all numbers found in all cells (reading row by row).
 * - TXT: Splits by newline/comma/space/tab and filters for numbers.
 */
export const parseDataFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const extension = file.name.split('.').pop()?.toLowerCase();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    reject(new Error("File is empty"));
                    return;
                }

                let extractedNumbers: number[] = [];

                if (extension === 'txt') {
                    // Text file: Read as string (Wait, readAsArrayBuffer returns buffer, needed to decode)
                    // We should use TextDecoder for ArrayBuffer
                    const text = new TextDecoder("utf-8").decode(data as ArrayBuffer);

                    text.split(/[\n\r\t, ]+/).forEach(val => {
                        const trimmed = val.trim();
                        if (trimmed !== '' && !isNaN(Number(trimmed))) {
                            extractedNumbers.push(Number(trimmed));
                        }
                    });
                } else {
                    // Excel / CSV / Other formats supported by SheetJS
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert sheet to JSON array of arrays (rows)
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                    // Flatten and extract numbers
                    jsonData.forEach(row => {
                        row.forEach(cell => {
                            if (typeof cell === 'number') {
                                extractedNumbers.push(cell);
                            } else if (typeof cell === 'string') {
                                const trimmed = cell.trim();
                                if (trimmed !== '' && !isNaN(Number(trimmed))) {
                                    extractedNumbers.push(Number(trimmed));
                                }
                            }
                        });
                    });
                }

                if (extractedNumbers.length === 0) {
                    reject(new Error("No valid numbers found in the file."));
                } else {
                    resolve(extractedNumbers.join(', '));
                }

            } catch (err) {
                console.error("File parsing error:", err);
                reject(new Error("Failed to parse file. Please ensure it is a valid CSV, Excel, or Text file."));
            }
        };

        reader.onerror = () => reject(new Error("Failed to read file"));

        // Read all as ArrayBuffer to support XLSX
        reader.readAsArrayBuffer(file);
    });
};
