import React from "react";
import MaskCharSynthetizer from "./maskSynthetizer";
import {
    MaskedCharacterInfo,
    MaskedInputSettings,
} from "./types";

class MaskProcessor2 {
    private ref: React.MutableRefObject<HTMLInputElement>;
    private synthetizer: MaskCharSynthetizer;
    private settings: MaskedInputSettings;
    private mask: MaskedCharacterInfo[];

    private promptHidden: boolean = true;
    private updateSrcValue: (() => string) | undefined = undefined

    constructor(
        mask: string,
        settings: MaskedInputSettings,
        ref: React.MutableRefObject<HTMLInputElement>,
        valueUpdate?: () => string
    ) {
        this.ref = ref;
        this.settings = settings;
        this.synthetizer = new MaskCharSynthetizer(settings);
        this.mask = this.synthetizer.generate(mask, true);
        this.updateSrcValue = valueUpdate;
    }

    private hidePrompts() {
        this.promptHidden = true;
    }

    private showPrompts() {
        this.promptHidden = false;
    }

    public attachListeners() {
        if (this.settings.hidePromptOnLeave) {
            this.ref.current.addEventListener("blur", this.hidePrompts);
            this.ref.current.addEventListener("focus", this.showPrompts);
        }
    }

    public deattachListeners() {
        if (this.settings.hidePromptOnLeave) {
            this.ref.current.removeEventListener("blur", this.hidePrompts);
            this.ref.current.removeEventListener("focus", this.showPrompts);
        }
    }
}

export default MaskProcessor2;