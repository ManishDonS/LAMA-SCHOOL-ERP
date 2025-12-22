import NepaliDate from 'nepali-date-converter';

export type DateFormat = 'AD' | 'BS';

/**
 * Formats a date string or Date object into the specified format (AD or BS).
 * 
 * @param date - The date to format (string or Date object).
 * @param format - The target format ('AD' or 'BS').
 * @returns A formatted date string.
 */
export const formatDate = (date: string | Date | null | undefined, format: DateFormat = 'AD'): string => {
    if (!date) return '-';

    const d = new Date(date);

    // Check if date is valid
    if (isNaN(d.getTime())) return '-';

    if (format === 'BS') {
        try {
            const nepaliDate = new NepaliDate(d);
            return nepaliDate.format('YYYY-MM-DD');
        } catch (error) {
            console.error('Error converting to Nepali date:', error);
            return d.toLocaleDateString();
        }
    }

    // Default AD format: YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Converts a Nepali date string (YYYY-MM-DD) to an AD Date object.
 */
export const nepaliToAD = (nepaliDateStr: string): Date => {
    const nepaliDate = new NepaliDate(nepaliDateStr);
    return nepaliDate.toJsDate();
};

/**
 * Get current date in specified format.
 */
export const getCurrentDateFormatted = (format: DateFormat = 'AD'): string => {
    return formatDate(new Date(), format);
};
