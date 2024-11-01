import React from "react";
import MaskCharSynthetizer from "./maskSynthetizer";
import { MaskedInputSettings } from "./types";
import { defaultSettigns } from "./consts";
import { Logger } from "./logger";

class MaskProcessor2 {
    private logger: Logger = new Logger("processor");

    private ref: React.MutableRefObject<HTMLInputElement>;
    private synthetizer: MaskCharSynthetizer;
    private settings: MaskedInputSettings = defaultSettigns;

    /** callback to update displayable value at higher level */
    private updateSrcValue: ((maskedValue: string) => void) | undefined =
        undefined;

    public get value(): string {
        return this.synthetizer.value;
    }

    constructor(mask: string, ref: React.MutableRefObject<HTMLInputElement>) {
        this.ref = ref;
        this.synthetizer = new MaskCharSynthetizer();
        this.synthetizer.generate(mask);
    }

    public applySettings(settings: MaskedInputSettings) {
        this.logger.debug("setting application");
        this.settings = settings;
        this.synthetizer.applySettings(settings);
        this.synthetizer.hidden =
            settings.hidePromptOnLeave &&
            this.ref.current !== document.activeElement;
        this.invokeUpdate();
    }

    public applyUpdater(valueUpdate?: (maskedValue: string) => void) {
        this.updateSrcValue = valueUpdate;
        this.invokeUpdate();
    }

    public applyValue(value: string) {
        const lastPuttedIdx = this.synthetizer.putSymbols(value, 0);
        this.invokeUpdate(lastPuttedIdx);
    }

    private invokeUpdate(caretStart?: number, caretEnd?: number) {
        const value = this.synthetizer.value;
        const start = caretStart ?? value.length;
        const end = caretEnd ?? start;
        this.ref.current.value = value;
        this.ref.current.selectionStart = start;
        this.ref.current.selectionEnd = end;

        if (this.updateSrcValue) {
            this.logger.debug("updated src value", value);
            this.updateSrcValue(value);
        }
    }

    private hidePrompts() {
        this.synthetizer.hidden = true;
        this.invokeUpdate();
    }

    private showPrompts() {
        if (this.settings.hidePromptOnLeave) this.synthetizer.hidden = false;
        this.invokeUpdate();
        const actualIdx = this.synthetizer.lastActualIdx;
        this.ref.current.selectionStart = actualIdx;
        this.ref.current.selectionEnd = actualIdx;
    }

    private get selectionStartIdx(): number {
        return this.ref.current.selectionStart ?? 1;
    }

    private get selectionEndIdx(): number {
        return this.ref.current.selectionEnd ?? 1;
    }

    private set selectionStartIdx(value: number) {
        this.ref.current.selectionStart = value;
    }

    private set selectionEndIdx(value: number) {
        this.ref.current.selectionEnd = value;
    }

    private onBeforeInput(e: Event) {
        const event = e as InputEvent;
        this.logger.debug("onBeforeInput launched");
        if (event.inputType.startsWith("insert")) {
            event.preventDefault();
            const data = event.data;

            const startIdx = this.selectionStartIdx,
                endIdx = this.selectionEndIdx;
            if (startIdx !== endIdx) {
                const value = this.synthetizer.value;
                const newValue = value.substring(startIdx, endIdx);
                this.synthetizer.regenerate(newValue, startIdx);
            }

            try {
                const lastPuttedIdx = data
                    ? this.synthetizer.putSymbols(data, startIdx)
                    : 0;

                this.invokeUpdate(lastPuttedIdx);
            } catch (e) {
                const error = e as Error;
                this.logger.shift().error(error.message).unshift();
            }

            this.logger
                .shift()
                .debug(
                    "Input data:",
                    event.data,
                    "event type: ",
                    event.inputType
                )
                .unshift();
        }
    }

    private onInput() {
        const currentValue = this.ref.current.value;
        const storedValue = this.synthetizer.value;
        this.logger.debug("onInput: ", currentValue, "stored: ", storedValue);
        if (currentValue.length !== storedValue.length) {
            const diffIdx = this.synthetizer.regenerate(currentValue);
            this.logger.shift().debug(
                "regenerated: ",
                this.synthetizer.value,
                "idx:",
                diffIdx
            ).unshift();
            this.invokeUpdate(diffIdx);
        }
    }

    private onCopy(e: Event) {
        const event = e as ClipboardEvent;
        const copied = this.synthetizer.toString(
            (settings) => settings.cutCopyMaskFormat
        );
        event.clipboardData?.setData("text/plain", copied);
        event.preventDefault();
    }

    public get output(): string {
        return this.synthetizer.toString((settings) => settings.textMaskFormat);
    }

    private hidePromptsBound = this.hidePrompts.bind(this);
    private showPromptsBound = this.showPrompts.bind(this);
    private onInputBound = this.onInput.bind(this);
    private onBeforeInputBound = this.onBeforeInput.bind(this);
    private onCopyBound = this.onCopy.bind(this);

    public attachListeners() {
        this.logger.debug("Listeners attaching:").shift();

        if (this.settings.hidePromptOnLeave) {
            this.logger.debug("attaching: blur");
            this.ref.current.addEventListener("blur", this.hidePromptsBound);
        }

        this.logger.debug("attaching: focus");
        this.ref.current.addEventListener("focus", this.showPromptsBound);
        this.logger.debug("attaching: input");
        this.ref.current.addEventListener("input", this.onInputBound);
        this.logger.debug("attaching: beforeinput");
        this.ref.current.addEventListener(
            "beforeinput",
            this.onBeforeInputBound
        );
        this.logger.debug("attaching: copy").unshift();
        this.ref.current.addEventListener("copy", this.onCopyBound);
    }

    public deattachListeners() {
        this.logger.debug("Listeners deattaching:").shift();
        if (this.settings.hidePromptOnLeave) {
            this.logger.debug("deattaching: blur");
            this.ref.current.removeEventListener("blur", this.hidePromptsBound);
        }

        this.logger.debug("deattaching: focus");
        this.ref.current.removeEventListener("focus", this.showPromptsBound);
        this.logger.debug("deattaching: input");

        this.ref.current.removeEventListener("input", this.onInputBound);
        this.logger.debug("deattaching: beforeinput");

        this.ref.current.removeEventListener(
            "beforeinput",
            this.onBeforeInputBound
        );

        this.logger.debug("deattaching: copy").unshift();
        this.ref.current.removeEventListener("copy", this.onCopyBound);
    }
}

export default MaskProcessor2;
