import MaskCharSynthetizer from "../MaskedEngine/maskSynthetizer";
import { MaskFormat } from "../MaskedEngine/types";

export const maskSynthetizer = new MaskCharSynthetizer({
    beepOnError: false,
    cutCopyMaskFormat: MaskFormat.IncludePromptAndLiterals,
    hidePromptOnLeave: false,
    promptSymbol: "_",
    rejectInputOnFirstFailure: false,
    resetOnPrompt: false,
    resetOnSpace: false,
    skipLiterals: false,
    textMaskFormat: MaskFormat.ExcludePromptAndLiterals,
});

export const maskSynthetizerIncludeEither = new MaskCharSynthetizer({
    beepOnError: false,
    cutCopyMaskFormat: MaskFormat.IncludeLiterals,
    hidePromptOnLeave: false,
    promptSymbol: "_",
    rejectInputOnFirstFailure: false,
    resetOnPrompt: false,
    resetOnSpace: false,
    skipLiterals: false,
    textMaskFormat: MaskFormat.IncludePrompt,
})

export const nonReqMaskWithLiterl = "99.99";
export const nonReqMask = "9999";
export const maskWithLetterInside = "99L99";
export const maskEndLetter = "999L";
