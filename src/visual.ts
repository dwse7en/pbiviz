/*
 * 核心视觉对象逻辑 (Core Visual Logic)
 * 包含多语言支持 (Multi-language) 与高级筛选器 (Advanced Filter) 触发。
 */
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualFormattingSettingsModel } from "./settings";

import { AdvancedFilter, IFilterColumnTarget } from "powerbi-models";

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    // UI Elements
    private container: HTMLDivElement;
    private startDateInput: HTMLInputElement;
    private endDateInput: HTMLInputElement;
    private headerInput: HTMLInputElement;
    // references to icon buttons so we can style them later
    private clearIconButton: HTMLButtonElement | null = null;
    private resetIconButton: HTMLButtonElement | null = null;

    // colors cached from formatting
    private _iconClearColor: string | null = null;
    private _iconResetColor: string | null = null;

    private readonly CLEAR_ICON_SVG = `
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M44.7818 24.1702L31.918 7.09935L14.1348 20.5L27.5 37L30.8556 34.6643L44.7818 24.1702Z" 
        stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <path d="M27.4998 37L23.6613 40.0748L13.0978 40.074L10.4973 36.6231L4.06543 28.0876L14.4998 20.2248" 
        stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <path d="M13.2056 40.072L44.5653 40.072" 
        stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;

    private readonly RESET_ICON_SVG = ` 
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 21l-6 -6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.268 12.043a7.017 7.017 0 0 0 6.634 4.957a7.012 7.012 0 0 0 7.043 -6.131a7 7 0 0 0 -5.314 -7.672a7.021 7.021 0 0 0 -8.241 4.403" 
        stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 4v4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    
    // State
    private currentTarget: IFilterColumnTarget | null = null;
    private latestDataView: powerbi.DataView | null = null; // 保存最近一次的数据视图，用于默认度量等
    private initialMin: string = "";
    private initialMax: string = "";
    private isLocaleZH: boolean;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.target = options.element;
        this.formattingSettingsService = new FormattingSettingsService();
        this.isLocaleZH = this.host.locale.indexOf("zh") === 0;

        this.initUI();
    }


    private initUI() {
        this.container = document.createElement("div");
        this.container.className = "date-slicer-container";

        // Header row: editable title and hover-revealed icons (clear/reset)
        const headerRow = document.createElement("div");
        headerRow.className = "header-row";

        this.headerInput = document.createElement("input");
        this.headerInput.type = "text";
        this.headerInput.className = "header-input";
        this.headerInput.readOnly = true; // editing moved to formatting pane
        this.headerInput.placeholder = this.isLocaleZH ? "字段名" : "Field";

        const iconsContainer = document.createElement("div");
        iconsContainer.className = "icons";
        this.clearIconButton = this.createIconButton(this.CLEAR_ICON_SVG, () => this.clearFilter(), this.isLocaleZH ? "清除" : "Clear");
        this.resetIconButton = this.createIconButton(this.RESET_ICON_SVG, () => this.applyDefaultMeasures(), this.isLocaleZH ? "重置" : "Reset");
        iconsContainer.append(this.clearIconButton, this.resetIconButton);

        headerRow.append(this.headerInput, iconsContainer);
        this.container.append(headerRow);
        // 1. Date Inputs Panel (双日期输入框)
        const inputsPanel = document.createElement("div");
        inputsPanel.className = "inputs-panel";

        const startGroup = document.createElement("div");
        startGroup.className = "input-group";

        this.startDateInput = document.createElement("input");
        this.startDateInput.type = "date";
        // remember which input was last edited so we can auto-correct invalid ranges
        this.startDateInput.addEventListener("change", (e) => this.onDateChange(e as Event));
        startGroup.append(this.startDateInput);

        const endGroup = document.createElement("div");
        endGroup.className = "input-group";
        this.endDateInput = document.createElement("input");
        this.endDateInput.type = "date";
        this.endDateInput.addEventListener("change", (e) => this.onDateChange(e as Event));
        endGroup.append(this.endDateInput);

        inputsPanel.append(startGroup, endGroup);
        
        // append elements into main container
        this.container.append(inputsPanel);
        this.target.appendChild(this.container);
    }

    private createButton(text: string, onClick: () => void, extraClass?: string): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.innerText = text;
        if (extraClass) btn.classList.add(extraClass);
        btn.addEventListener("click", onClick);
        return btn;
    }

    private createIconButton(icon: string, onClick: () => void, title?: string): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.className = "icon-btn";
        btn.innerHTML = icon;
        if (title) btn.title = title;
        btn.addEventListener("click", onClick);
        // colors will be applied in applyFormatting()
        return btn;
    }

    public update(options: VisualUpdateOptions) {
        const dataView = options.dataViews && options.dataViews[0];
        this.latestDataView = dataView || null;
        // 提取格式化设置 (Formatting Pane)
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, dataView);
        this.applyFormatting();

        if (!dataView || !dataView.categorical || !dataView.categorical.categories) return;

        const category = dataView.categorical.categories[0];
        
        // 提取数据视图映射 (Data View Mappings) 中的目标字段，作为过滤目标
        this.currentTarget = {
            table: category.source.queryName.substr(0, category.source.queryName.indexOf('.')),
            column: category.source.displayName
        };

        // header text is obtained from formatting settings; default to field name if empty
        if (this.headerInput) {
            const textSetting = this.formattingSettings?.headerTextCard?.headerText?.value;
            this.headerInput.value = textSetting && textSetting.length ? textSetting : category.source.displayName;
        }

        // 默认值：当没有用户手动选择时，使用类别中的最小/最大日期，并设置控件范围
        if (category.values && category.values.length) {
            const dates = category.values
                .map(v => new Date(v as any).getTime())
                .filter(t => !isNaN(t));
            if (dates.length) {
                const min = new Date(Math.min(...dates));
                const max = new Date(Math.max(...dates));
                const minStr = this.formatDate(min);
                const maxStr = this.formatDate(max);
                this.initialMin = minStr;
                this.initialMax = maxStr;
                this.startDateInput.min = minStr;
                this.startDateInput.max = maxStr;
                this.endDateInput.min = minStr;
                this.endDateInput.max = maxStr;
                if (!this.startDateInput.value) {
                    this.startDateInput.value = minStr;
                }
                if (!this.endDateInput.value) {
                    this.endDateInput.value = maxStr;
                }
            }
        }

        // 处理从书签或其它视觉对象传入的过滤状态同步
        // 实际上线环境中应提取 options.jsonFilters 并将其还原到 UI 
        this.validateDates(); // in case defaults created invalid range
        this.applyFilter();
    }

    private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    private applyFormatting() {
        if (!this.formattingSettings) return;
        const inputSettings = this.formattingSettings.dateInputsCard;

        // header formatting / text value
        const headerSettings = (this.formattingSettings as any).headerTextCard;
        if (headerSettings && this.headerInput) {
            // text value may change via settings; update immediately
            const textSetting = headerSettings.headerText && headerSettings.headerText.value;
            if (textSetting && textSetting.length) {
                this.headerInput.value = textSetting;
            }

            this.headerInput.style.fontFamily = headerSettings.fontFamily.value;
            this.headerInput.style.color = headerSettings.fontColor.value.value;
            this.headerInput.style.fontSize = `${headerSettings.fontSize.value}px`;
            this.headerInput.style.fontWeight = headerSettings.bold.value ? "bold" : "normal";
            this.headerInput.style.fontStyle = headerSettings.italic.value ? "italic" : "normal";
            this.headerInput.style.textDecoration = headerSettings.underline.value ? "underline" : "none";
            // header background with transparency on header wrapper
            const headerBgHex = headerSettings.headerBackgroundColor.value.value;
            const headerBgTrans = headerSettings.headerBackgroundTransparency.value;
            const headerRow = this.headerInput.parentElement as HTMLElement;
            const headerRgb = this.hexToRgb(headerBgHex);
            if (headerRow) {
                if (headerRgb) {
                    const alphaBg = (100 - headerBgTrans) / 100;
                    headerRow.style.backgroundColor = `rgba(${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b}, ${alphaBg})`;
                } else {
                    headerRow.style.backgroundColor = headerBgHex;
                }
                // apply top/bottom margins (as padding) from formatting
                try {
                    const top = headerSettings.headerMarginTop && headerSettings.headerMarginTop.value != null ? headerSettings.headerMarginTop.value : 6;
                    const bottom = headerSettings.headerMarginBottom && headerSettings.headerMarginBottom.value != null ? headerSettings.headerMarginBottom.value : 6;
                    headerRow.style.paddingTop = `${top}px`;
                    headerRow.style.paddingBottom = `${bottom}px`;
                } catch (e) {
                    // ignore if settings not present
                }
            }
        }
        // icon colors
        const iconSettings = (this.formattingSettings as any).headerIconCard;
        if (iconSettings) {
            this._iconClearColor = iconSettings.clearIconColor.value.value;
            this._iconResetColor = iconSettings.resetIconColor.value.value;
        }
        // update icon button styles if already created
        if (this.clearIconButton && this._iconClearColor) {
            this.clearIconButton.style.color = this._iconClearColor;
        }
        if (this.resetIconButton && this._iconResetColor) {
            this.resetIconButton.style.color = this._iconResetColor;
        }

        this.startDateInput.style.fontFamily = inputSettings.fontFamily.value;
        this.startDateInput.style.color = inputSettings.fontColor.value.value;
        this.startDateInput.style.fontSize = `${inputSettings.fontSize.value}px`;
        this.endDateInput.style.fontFamily = inputSettings.fontFamily.value;
        this.endDateInput.style.color = inputSettings.fontColor.value.value;
        this.endDateInput.style.fontSize = `${inputSettings.fontSize.value}px`;

        // 输入框背景颜色 + 透明度
        const inputBgHex = inputSettings.inputBackgroundColor.value.value;
        const inputBgTrans = inputSettings.inputBackgroundTransparency.value;
        const inputBgRgb = this.hexToRgb(inputBgHex);
        if (inputBgRgb) {
            const alphaBg = (100 - inputBgTrans) / 100;
            const bgColor = `rgba(${inputBgRgb.r}, ${inputBgRgb.g}, ${inputBgRgb.b}, ${alphaBg})`;
            this.startDateInput.style.backgroundColor = bgColor;
            this.endDateInput.style.backgroundColor = bgColor;
        } else {
            this.startDateInput.style.backgroundColor = inputBgHex;
            this.endDateInput.style.backgroundColor = inputBgHex;
        }

        // 边框颜色
        const borderColor = inputSettings.inputBorderColor.value.value;
        this.startDateInput.style.borderColor = borderColor;
        this.endDateInput.style.borderColor = borderColor;

        // 文本样式
        this.startDateInput.style.fontWeight = inputSettings.bold.value ? "bold" : "normal";
        this.endDateInput.style.fontWeight = inputSettings.bold.value ? "bold" : "normal";
        this.startDateInput.style.fontStyle = inputSettings.italic.value ? "italic" : "normal";
        this.endDateInput.style.fontStyle = inputSettings.italic.value ? "italic" : "normal";
        this.startDateInput.style.textDecoration = inputSettings.underline.value ? "underline" : "none";
        this.endDateInput.style.textDecoration = inputSettings.underline.value ? "underline" : "none";
    }

    private applyFilter() {
        if (!this.currentTarget || (!this.startDateInput.value && !this.endDateInput.value)) return;

        // if validation error exists, do not apply
        if (this.startDateInput.classList.contains("invalid") || this.endDateInput.classList.contains("invalid")) {
            return;
        }

        const conditions: any[] = [];
        if (this.startDateInput.value) {
            conditions.push({
                operator: "GreaterThanOrEqual",
                value: new Date(this.startDateInput.value).toISOString()
            });
        }
        if (this.endDateInput.value) {
            conditions.push({
                operator: "LessThanOrEqual",
                value: new Date(this.endDateInput.value).toISOString()
            });
        }

        const filter = new AdvancedFilter(this.currentTarget, "And", conditions);
        this.host.applyJsonFilter(filter, "general", "filter", powerbi.FilterAction.merge);
    }

    private clearFilter() {
        this.startDateInput.value = "";
        this.endDateInput.value = "";
        this.startDateInput.classList.remove("invalid");
        this.endDateInput.classList.remove("invalid");
        this.host.applyJsonFilter(null, "general", "filter", powerbi.FilterAction.remove);
    }


    private applyDefaultMeasures() {
        // 如果用户提供了度量值，则设置为度量的结果，否则回退到 min/max值。
        const dv = this.latestDataView;
        if (dv && dv.categorical && dv.categorical.values) {
            const values = dv.categorical.values;
            // 约定第一个为 defaultStart, 第二个为 defaultEnd
            if (values.length >= 2) {
                const startVal = values[0].values[0] as any; // could be number/string/Date/true
                const endVal = values[1].values[0] as any;
                if (startVal != null && startVal !== true) {
                    this.startDateInput.value = this.formatDate(startVal);
                }
                if (endVal != null && endVal !== true) {
                    this.endDateInput.value = this.formatDate(endVal);
                }
            }
        }
        // 再次应用过滤确保同步
        this.applyFilter();
    }

    // store which field triggered the change so validation can correct the other value if needed
    private lastChanged: "start" | "end" | null = null;

    private onDateChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target === this.startDateInput) {
            this.lastChanged = "start";
        } else if (target === this.endDateInput) {
            this.lastChanged = "end";
        }

        // adjust bounds of the opposite field
        const startVal = this.startDateInput.value;
        const endVal = this.endDateInput.value;
        if (startVal) {
            this.endDateInput.min = startVal;
        } else {
            this.endDateInput.min = this.initialMin;
        }
        if (endVal) {
            this.startDateInput.max = endVal;
        } else {
            this.startDateInput.max = this.initialMax;
        }

        this.validateDates();
        this.applyFilter();
    }

    private validateDates() {
        let start = this.startDateInput.value ? new Date(this.startDateInput.value) : null;
        let end = this.endDateInput.value ? new Date(this.endDateInput.value) : null;

        if (start && end && start > end) {
            // auto-correct based on which field changed last
            if (this.lastChanged === "start") {
                // bump end up to match start
                this.endDateInput.value = this.startDateInput.value;
            } else if (this.lastChanged === "end") {
                // pull start down to match end
                this.startDateInput.value = this.endDateInput.value;
            } else {
                // no record of which changed (e.g. initial sync) - just swap values
                this.startDateInput.value = this.formatDate(end);
                this.endDateInput.value = this.formatDate(start);
            }
            // update start/end variables after correction
            start = this.startDateInput.value ? new Date(this.startDateInput.value) : null;
            end = this.endDateInput.value ? new Date(this.endDateInput.value) : null;
        }

        // after potential adjustment, clear invalid flags
        this.startDateInput.classList.remove("invalid");
        this.endDateInput.classList.remove("invalid");
    }

    private formatDate(date: Date | string): string {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        const yyyy = d.getFullYear();
        const mm = (d.getMonth() + 1).toString().padStart(2, "0");
        const dd = d.getDate().toString().padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}