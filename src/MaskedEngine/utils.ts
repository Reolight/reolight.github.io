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