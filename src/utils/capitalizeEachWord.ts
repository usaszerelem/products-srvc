function capitalizeWord(str: string): string {
    const firstChar = str.charAt(0).toLocaleUpperCase();

    const restOfStr = str.substring(1).toLocaleLowerCase();

    return `${firstChar}${restOfStr}`;
}

/**
 * Capitalize first letter in each word.
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeEachWord(str: string): string {
    return str
        .split(' ')
        .map((word: string) => capitalizeWord(word))
        .join(' ');
}
