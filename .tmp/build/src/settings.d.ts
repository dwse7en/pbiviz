import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
declare class DateInputsCard extends FormattingSettingsCard {
    fontFamily: formattingSettings.FontPicker;
    fontColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    bold: formattingSettings.ToggleSwitch;
    italic: formattingSettings.ToggleSwitch;
    underline: formattingSettings.ToggleSwitch;
    inputBackgroundColor: formattingSettings.ColorPicker;
    inputBackgroundTransparency: formattingSettings.Slider;
    inputBorderColor: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class HeaderTextCard extends FormattingSettingsCard {
    headerText: formattingSettings.TextInput;
    fontFamily: formattingSettings.FontPicker;
    fontColor: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    bold: formattingSettings.ToggleSwitch;
    italic: formattingSettings.ToggleSwitch;
    underline: formattingSettings.ToggleSwitch;
    headerBackgroundColor: formattingSettings.ColorPicker;
    headerBackgroundTransparency: formattingSettings.Slider;
    headerMarginTop: formattingSettings.NumUpDown;
    headerMarginBottom: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class HeaderIconCard extends FormattingSettingsCard {
    clearIconColor: formattingSettings.ColorPicker;
    resetIconColor: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
export declare class VisualFormattingSettingsModel extends FormattingSettingsModel {
    dateInputsCard: DateInputsCard;
    headerTextCard: HeaderTextCard;
    headerIconCard: HeaderIconCard;
    cards: (HeaderTextCard | HeaderIconCard | DateInputsCard)[];
}
export {};
