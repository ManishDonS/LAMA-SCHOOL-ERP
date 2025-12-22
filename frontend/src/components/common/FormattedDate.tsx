import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/nepaliDate';

interface FormattedDateProps {
    date: string | Date | null | undefined;
    className?: string;
}

/**
 * A component that displays a date formatted according to the global date format setting (AD or BS).
 */
const FormattedDate: React.FC<FormattedDateProps> = ({ date, className }) => {
    const { dateFormat } = useSettingsStore();
    const { activeModules } = useAuthStore();

    if (!date) return <span className={className}>-</span>;

    // Only use BS if the module is active and the setting is set to BS
    const isNepaliDateActive = activeModules.includes('nepali_date');
    const targetFormat = isNepaliDateActive ? dateFormat : 'AD';

    const formattedDate = formatDate(date, targetFormat);

    return (
        <span className={className} title={targetFormat === 'BS' ? 'Nepali Date (BS)' : 'English Date (AD)'}>
            {formattedDate}
        </span>
    );
};

export default FormattedDate;
