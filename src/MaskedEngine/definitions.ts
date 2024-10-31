import {
    ActionProcessor,
    LocalizedLiteralsDef,
    PlaceholderCharacterDef,
    PostprocessorCharacterDef,
    TERMINATOR,
} from "./types";

type MaskedCharacterDefscontainers = {
    placeholders: {
        [TCharacter in string]: PlaceholderCharacterDef;
    };
    postprocessors: {
        [TCharacter in string]: PostprocessorCharacterDef;
    };
    localizedLiterals: {
        [TCharacter in string]: LocalizedLiteralsDef;
    };

    isNotRegistered(character: string): boolean;
};

export const EmptyAction: ActionProcessor = (char) => char;

function getCurrencyHelper(locale: string): string | undefined {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD", // This is just a placeholder, it doesn't matter which currency you use here
    }).resolvedOptions().currency;
}

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
        ".": {
            visibleAs() {
                return Intl.NumberFormat(navigator.language)
                    .formatToParts(0.1)
                    .find((part) => part.type === "decimal")!.value;
            },
        },
        ",": {
            visibleAs() {
                return Intl.NumberFormat(navigator.language)
                    .formatToParts(1_000)
                    .find((part) => part.type === "group")!.value;
            },
        },
        $: {
            visibleAs() {
                const char = Intl.NumberFormat(navigator.language, {
                    style: "currency",
                    currency: getCurrencyHelper(navigator.language),
                })
                    .formatToParts(0)
                    .find((part) => part.type === "currency");
                return char!.value;
            },
        },
    },

    isNotRegistered(character: string): boolean {
        return (
            !(character in this.placeholders) &&
            !(character in this.postprocessors) &&
            !(character in this.localizedLiterals)
        );
    },
};

export default maskCharactersDefinitions;
