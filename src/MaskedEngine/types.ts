export type MaskedCharacter = {
    character: string;
};

export const TERMINATOR = "|";

export type LocalizedLiteralsDef = {
    visibleAs: () => string;
}

export type PlaceholderCharacterDef = {
    required: boolean;
    error: string;
    rule: RegExp;
};

export type ActionProcessor = (character: string) => string;

export type PostprocessorCharacterDef = {
    action: (newCharacter: string) => string;
};

export type MaskedCharacterInfo = {
    /** Выглядит как : тут или промпт, или как литерал */
    visibleAs: string;
    /** Требуется ли символ на этом месте */
    required: boolean;
    /** Введённый символ с клавиатуры*/
    actual: string | undefined;
    /** Можно ли заменить этот символ (касается промптов) */
    replaceable: boolean;
    /** Правило подстановки */
    rule?: RegExp;
    /** Текст ошибки для вывода */
    error?: string;
    /** Активное действие для этого символа */
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
    /**
     * Если true, не принимает все вводимые данные, если какой-то из символов не подходит под маску.
     * Если false, то отбрасывает неподходящие символы и вставляет в маску следующий подходящий
     */
    rejectInputOnFirstFailure: boolean;
};
