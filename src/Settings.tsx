import { FC } from "react";
import { MaskedInputSettings, MaskFormat } from "./MaskedEngine/types";

type TypeVariants = "string" | "option" | "number" | "boolean";

type SettingsPropsPropsType = {
    settings: MaskedInputSettings;
    onChange: (
        field: keyof MaskedInputSettings,
        value: MaskedInputSettings[keyof MaskedInputSettings]
    ) => void;
};

type SettingsValueViewPropsType<TKey extends keyof MaskedInputSettings> = {
    name: TKey;
    type: TypeVariants;
    value: MaskedInputSettings[TKey];
    onChange: (field: TKey, value: MaskedInputSettings[TKey]) => void;
};

const SettingsValueView = <TKey extends keyof MaskedInputSettings>({
    name,
    type,
    onChange,
    value,
}: SettingsValueViewPropsType<TKey>): JSX.Element => {
    switch (type) {
        case "boolean":
            return (
                <div style={{ display: "flex", flexDirection: "row" }}>
                    <input
                        style={{ display: "flex" }}
                        type="checkbox"
                        id={name}
                        checked={value as boolean}
                        onChange={(e) =>
                            onChange(
                                name,
                                e.target.checked as MaskedInputSettings[TKey]
                            )
                        }
                    />
                    <label style={{ display: "flex" }} htmlFor={name}>
                        {name}
                    </label>
                </div>
            );

        case "option":
            return (
                <div style={{ display: "flex", flexDirection: "row" }}>
                    {name}
                    <select
                        style={{ display: "flex" }}
                        id={name}
                        value={value as string}
                        onChange={(e) =>
                            onChange(
                                name,
                                e.target.value as MaskedInputSettings[TKey]
                            )
                        }
                    >
                        <option value={MaskFormat.ExcludePromptAndLiterals}>
                            ExcludePromptAndLiterals
                        </option>
                        <option value={MaskFormat.IncludeLiterals}>
                            IncludeLiterals
                        </option>
                        <option value={MaskFormat.IncludePrompt}>
                            IncludePrompt
                        </option>
                        <option value={MaskFormat.IncludePromptAndLiterals}>
                            IncludePromptAndLiterals
                        </option>
                    </select>
                </div>
            );
        case "string":
            return (
                <div style={{ display: "flex", flexDirection: "row" }}>
                    <input
                        style={{ display: "flex" }}
                        type="text"
                        id={name}
                        value={value as string}
                        onChange={(e) =>
                            onChange(
                                name,
                                e.target.value as MaskedInputSettings[TKey]
                            )
                        }
                    />
                    <label style={{ display: "flex" }} htmlFor={name}>
                        {name}
                    </label>
                </div>
            );

        default:
            return <></>;
    }
};

type TypeDef = {
    [TKey in keyof MaskedInputSettings]: TypeVariants;
};

const SettingTypes: TypeDef = {
    beepOnError: "boolean",
    cutCopyMaskFormat: "option",
    hidePromptOnLeave: "boolean",
    promptSymbol: "string",
    rejectInputOnFirstFailure: "boolean",
    resetOnPrompt: "boolean",
    resetOnSpace: "boolean",
    skipLiterals: "boolean",
    textMaskFormat: "option",
};

const SettingsView: FC<SettingsPropsPropsType> = ({ settings, onChange }) => {
    return (
        <div style={{ display: "flex", flexDirection: "column", margin: 16 }}>
            <h2>Settings</h2>
            {Object.getOwnPropertyNames(settings).map((name) => (
                <SettingsValueView
                    key={name}
                    type={SettingTypes[name as keyof MaskedInputSettings]}
                    name={name as keyof MaskedInputSettings}
                    onChange={onChange}
                    value={settings[name as keyof MaskedInputSettings]}
                />
            ))}
        </div>
    );
};

export default SettingsView;
