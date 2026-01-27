export const calculateStatusCategory = (poExpiryDate: Date, dpExtensionDate?: Date | null): string => {
    const latestDate = dpExtensionDate && dpExtensionDate > poExpiryDate ? dpExtensionDate : poExpiryDate;
    const now = new Date();
    const diffTime = latestDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Red';
    if (diffDays < 60) return 'Orange';
    return 'Green';
};
