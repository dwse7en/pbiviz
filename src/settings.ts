/*
 * 格式化模型 (Formatting Model) 核心配置
 */
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class DateInputsCard extends FormattingSettingsCard {
    fontFamily = new formattingSettings.FontPicker({
        name: "fontFamily",
        displayName: "字体",
        value: "Segoe UI"
    });
    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "字体颜色",
        value: { value: "#333333" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "字体大小",
        value: 12
    });

    // 文本样式设置：加粗/斜体/下划线
    bold = new formattingSettings.ToggleSwitch({
        name: "bold",
        displayName: "加粗",
        value: false
    });
    italic = new formattingSettings.ToggleSwitch({
        name: "italic",
        displayName: "斜体",
        value: false
    });
    underline = new formattingSettings.ToggleSwitch({
        name: "underline",
        displayName: "下划线",
        value: false
    });

    // 新增输入框背景设置
    inputBackgroundColor = new formattingSettings.ColorPicker({
        name: "inputBackgroundColor",
        displayName: "背景",
        value: { value: "#ffffff" }
    });
    inputBackgroundTransparency = new formattingSettings.Slider({
        name: "inputBackgroundTransparency",
        displayName: "透明度",
        value: 0,
        options: {
            minValue: { type: powerbi.visuals.ValidatorType.Min, value: 0 },
            maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 100 }
        }
    });

    // 输入框边框颜色
    inputBorderColor = new formattingSettings.ColorPicker({
        name: "inputBorderColor",
        displayName: "边框颜色",
        value: { value: "#a6a6a6" }
    });

    name: string = "dateInputs";
    displayName: string = "日期设置";
    slices: FormattingSettingsSlice[] = [
        this.fontFamily,
        this.fontColor,
        this.fontSize,
        this.bold,
        this.italic,
        this.underline,
        this.inputBackgroundColor,
        this.inputBackgroundTransparency,
        this.inputBorderColor
    ];
}

// header text card contains all properties related to the header string itself (including editable value)
class HeaderTextCard extends FormattingSettingsCard {
    // customizable text value, falls back to field name when empty
    headerText = new formattingSettings.TextInput({
        name: "headerText",
        displayName: "标头文本",
        value: "", // default empty, shows field name fallback in code
        placeholder: "<字段名>"
    });

    fontFamily = new formattingSettings.FontPicker({
        name: "fontFamily",
        displayName: "字体",
        value: "Segoe UI"
    });
    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "字体颜色",
        value: { value: "#333333" }
    });
    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "字体大小",
        value: 14
    });
    bold = new formattingSettings.ToggleSwitch({
        name: "bold",
        displayName: "加粗",
        value: false
    });
    italic = new formattingSettings.ToggleSwitch({
        name: "italic",
        displayName: "斜体",
        value: false
    });
    underline = new formattingSettings.ToggleSwitch({
        name: "underline",
        displayName: "下划线",
        value: false
    });

    // header background
    headerBackgroundColor = new formattingSettings.ColorPicker({
        name: "headerBackgroundColor",
        displayName: "背景",
        value: { value: "#ffffff" }
    });
    headerBackgroundTransparency = new formattingSettings.Slider({
        name: "headerBackgroundTransparency",
        displayName: "透明度",
        value: 0,
        options: {
            minValue: { type: powerbi.visuals.ValidatorType.Min, value: 0 },
            maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 100 }
        }
    });

    headerMarginTop = new formattingSettings.NumUpDown({
        name: "headerMarginTop",
        displayName: "上边距",
        value: 6
    });
    headerMarginBottom = new formattingSettings.NumUpDown({
        name: "headerMarginBottom",
        displayName: "下边距",
        value: 6
    });

    name: string = "dateHeaderText";
    displayName: string = "标头文本";
    slices: FormattingSettingsSlice[] = [
        this.headerText,
        this.fontFamily,
        this.fontColor,
        this.fontSize,
        this.bold,
        this.italic,
        this.underline,
        this.headerBackgroundColor,
        this.headerBackgroundTransparency,
        this.headerMarginTop,
        this.headerMarginBottom
    ];
}

// new card for icon-specific formatting (colors)
class HeaderIconCard extends FormattingSettingsCard {
    clearIconColor = new formattingSettings.ColorPicker({
        name: "clearIconColor",
        displayName: "清除图标颜色",
        value: { value: "#666666" }
    });
    resetIconColor = new formattingSettings.ColorPicker({
        name: "resetIconColor",
        displayName: "重置图标颜色",
        value: { value: "#666666" }
    });

    name: string = "dateHeaderIcons";
    displayName: string = "标头图标";
    slices: FormattingSettingsSlice[] = [
        this.clearIconColor,
        this.resetIconColor
    ];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    dateInputsCard = new DateInputsCard();
    headerTextCard = new HeaderTextCard();
    headerIconCard = new HeaderIconCard();
    cards = [this.headerTextCard, this.headerIconCard, this.dateInputsCard];
}