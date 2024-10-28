export type MaskedCharacter = {
    character: string;
};

export const TERMINATOR = "|";

export type PlaceholderCharacterDef = {
    required: boolean;
    error: string;
    rule: RegExp;
};

export type ActionProcessor = (character: string) => string;

export type PostprocessorCharacterDef = {
    action: (newCharacter: string) => string;
};

export type MaskCharacterInfo = {
    visibleAs: string;
    replaceable: boolean;
    rule?: RegExp;
    error?: string;
    action: (character: string) => string;
};

/** Способ форматирования строки в поле с маской */
export enum MaskFormat {
    /** Исключать из выходной строки литералы и символы приглашения (заменяются пробелами) */
    ExcludePromptAndLiterals,
    /** Включать символы приглашения в выходную строку */
    IncludePrompt,
    /** Включать литералы в выходную строку, (символы приглашения заменяются пробелами) */
    IncludeLiterals,
    /** Включать и символы приглашения, и литералы */
    IncludePromptAndLiterals,
}

/** Настройки для поля текст с маской */
export type MaskedInputSettings = {
    /** Какой символ приглашения использовать */
    promptSymbol: string;
    /** При потере фокуса прятать символы приглашения */
    hidePromptOnLeave: boolean;
    /** Как форматировать возвращаемый текст из поля с масокй */
    textMaskFormat: MaskFormat;
    /** Как форматировать копируемый в буфер текст из поля с маской */
    cutCopyMaskFormat: MaskFormat;
    /** Бипать при ошибке (прямое бипанье недоступно, поэтому пока недоступно) */
    beepOnError: boolean;
    /** Пропускать литералы. Если false, то есть опция вводить литералы с клавиатуры, иначе требует ввода следующего символа */
    skipLiterals: boolean;
    /** Название сохранено с WinForms. Несмотря на название, ничего не сбрасывает, просто пропускает ввод текущего символа.
     * Если после этого следуют другие символы, они просто двигаются вправо, если там есть подходящие места
     */
    resetOnSpace: boolean;
    /** Название сохранено с WinForms. Несмотря на название, ничего не сбрасывает, просто пропускает ввод текущего символа.
     * Если после этого следуют другие символы, они просто двигаются вправо, если там есть подходящие места
     */
    resetOnPrompt: boolean;
};
