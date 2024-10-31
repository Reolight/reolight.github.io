import { currencyMap } from "./consts";
import { MaskedCharacterInfo } from "./types";

export function createErrorMessage(
    charMask: MaskedCharacterInfo,
    char: string
): string {
    return !charMask.error
        ? `Символ ${char} не подходит под правило`
        : charMask.error.indexOf("{0}") >= 0
        ? charMask.error.replace("{0}", char)
        : charMask.error;
}

export function getCurrencyCode(locale: string) {
    const key = Object.keys(currencyMap).find(
        (k) => k === locale || k.startsWith(locale) || k.endsWith(locale)
    ) as keyof typeof currencyMap | undefined;

    return !key ? currencyMap["en-US"] : currencyMap[key];
}
