import { MaskFormat } from "./types";

export const currencyMap = {
    "en-US": "USD",
    "ru-RU": "RUB",
    "de-DE": "EUR",
    "fr-FR": "EUR",
    "jp-JP": "JPY",
    "ja-JP": "JPY",
    "uk-UA": "UAH",
    "zh-CN": 'CNY',
    "be-BY": "BYN",
};

export const defaultSettigns = {
    beepOnError: false,
    cutCopyMaskFormat: MaskFormat.ExcludePromptAndLiterals,
    hidePromptOnLeave: false,
    promptSymbol: "_",
    resetOnPrompt: false,
    resetOnSpace: false,
    skipLiterals: false,
    textMaskFormat: MaskFormat.ExcludePromptAndLiterals,
    rejectInputOnFirstFailure: false,
};