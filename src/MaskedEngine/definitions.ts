import {
    ActionProcessor,
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

    isNotRegistered(character: string): boolean;
};

export const EmptyAction: ActionProcessor = (char) => char;

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
            error: "Символ {0} не является буквой или цифрой"
        },
        a: {
            rule: /\w/,
            required: false,
            error: "Символ {0} не является буквой или цифрой"
        }
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

    isNotRegistered(character: string): boolean {
        return (
            !(character in this.placeholders) &&
            !(character in this.postprocessors)
        );
    },
};

export default maskCharactersDefinitions;
