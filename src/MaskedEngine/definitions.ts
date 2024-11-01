import { ActionProcessor, MaskedCharacterDefscontainers, TERMINATOR } from "./types";
import { getCurrencyCode } from "./utils";

export const EmptyAction: ActionProcessor = (char) => char;

const DUMMY_DATE = new Date();
const DUMMY_FRAC = 0.1;
const DUMMY_THOUSAND = 1_000;

const maskCharactersDefinitions: MaskedCharacterDefscontainers = {
    placeholders: {
        "0": {
            rule: /[0-9]/,
            required: true,
            error: 'Символ "{0}" не является цифрой',
        },
        "9": {
            rule: /[0-9\s]/,
            required: false,
            error: 'Символ "{0}" не цифра и не пробел',
        },
        L: {
            rule: /[a-zA-Zа-яА-Я]/,
            required: true,
            error: 'Символ "{0}" не является латинским или кириллическим символом',
        },
        "#": {
            rule: /[0-9\s+-]/,
            required: false,
            error: 'Символ "{0}" не является цифрой, пробелом или знаком + -',
        },
        "?": {
            rule: /[a-zA-Zа-яА-Я]/,
            required: true,
            error: 'Символ "{0}" не является латинским или кириллическим символом',
        },
        "&": {
            rule: /\p{L}/u,
            required: true,
            error: "Символ {0} не является буквой",
        },
        C: {
            rule: /\p{L}/u,
            required: false,
            error: "Символ {0} не является буквой",
        },
        A: {
            rule: /\w/,
            required: true,
            error: "Символ {0} не является буквой или цифрой",
        },
        a: {
            rule: /\w/,
            required: false,
            error: "Символ {0} не является буквой или цифрой",
        },
    },
    postprocessors: {
        ">": {
            action(newCharacter) {
                return newCharacter.toLocaleUpperCase();
            },
        },
        "<": {
            action(newCharacter) {
                return newCharacter.toLocaleLowerCase();
            },
        },
        [TERMINATOR]: {
            action: EmptyAction,
        },
    },
    localizedLiterals: {
        "/": {
            visibleAs() {
                return Intl.DateTimeFormat(navigator.language)
                    .formatToParts(DUMMY_DATE)
                    .find((part) => part.type === "literal")!.value;
            },
        },
        ".": {
            visibleAs() {
                return Intl.NumberFormat(navigator.language)
                    .formatToParts(DUMMY_FRAC)
                    .find((part) => part.type === "decimal")!.value;
            },
        },
        ",": {
            visibleAs() {
                return Intl.NumberFormat(navigator.language)
                    .formatToParts(DUMMY_THOUSAND)
                    .find((part) => part.type === "group")!.value;
            },
        },
        $: {
            visibleAs() {
                return Intl.NumberFormat(navigator.language, {
                    style: "currency",
                    currency: getCurrencyCode(navigator.language),
                })
                    .formatToParts(DUMMY_FRAC)
                    .find((part) => part.type === "currency")!.value;
            },
        },
        ":": {
            visibleAs() {
                const parts = Intl.DateTimeFormat(navigator.language, {
                    timeStyle: "short",
                    dateStyle: "short",
                }).formatToParts(DUMMY_DATE);

                for (let i = parts.length - 1; i > 0; i -= 1) {
                    if (parts[i].type === "literal") {
                        return parts[i].value;
                    }
                }

                return ":";
            },
        },
    },

    isNotRegistered(character: string): boolean {
        return !(character in this.placeholders) && !(character in this.postprocessors) && !(character in this.localizedLiterals);
    },
};

export default maskCharactersDefinitions;
