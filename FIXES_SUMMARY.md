# 日期切片器 Bug 修复总结

## 修复的问题

### 问题1：点击清除按钮时返回错误的日期
**问题描述**：点击清除按钮后，输入框显示的是度量值的默认日期，而不是数据的最小/最大日期范围。

**修复方案**：
- 修改 `clearFilter()` 方法，使其在清除时将输入框设置为 `initialMin` 和 `initialMax`（数据的最小/最大日期）而不是留空
- 添加 `isUserCleared` 标记来追踪用户是否手动清除了过滤器

**代码变更**：
```typescript
private clearFilter() {
    this.startDateInput.value = this.initialMin;  // 清除时显示最小日期
    this.endDateInput.value = this.initialMax;    // 清除时显示最大日期
    // ...
    this.isUserCleared = true;  // 标记用户已主动清除
}
```

### 问题2：度量值动态改变时切片器没有响应
**问题描述**：当在Power BI页面上动态改变拖入的度量值（开始日期、结束日期）时，切片器无法自动更新显示的日期。

**修复方案**：
- 在 `update()` 方法的开始添加度量值变化检测逻辑
- 保存上一次应用的度量值（`lastAppliedStartMeasure` 和 `lastAppliedEndMeasure`）
- 当度量值改变时，立即更新输入框并应用新的过滤器
- 仅当用户未手动清除时才自动应用度量值变化

**代码变更**：
- 添加新的状态变量：
  ```typescript
  private lastAppliedStartMeasure: string = "";
  private lastAppliedEndMeasure: string = "";
  private isUserCleared: boolean = false;
  ```

- 在 `update()` 方法中优先检查度量值变化：
  ```typescript
  // 检查度量值是否存在及是否发生变化
  if (hasDefaultMeasures && !this.isUserCleared) {
      const currentStartMeasure = ...
      const currentEndMeasure = ...
      
      // 检测度量值是否改变
      if (currentStartMeasure !== this.lastAppliedStartMeasure || 
          currentEndMeasure !== this.lastAppliedEndMeasure) {
          // 自动应用新的度量值
          this.startDateInput.value = currentStartMeasure;
          this.endDateInput.value = currentEndMeasure;
          this.validateDates();
          this.applyFilter();
          return;
      }
  }
  ```

## 状态管理流程

1. **初始化**：3个状态变量都设为初始值
   - `isUserCleared = false`
   - `suppressDefaultRangeApply = false`
   - `lastAppliedStartMeasure = ""`
   - `lastAppliedEndMeasure = ""`

2. **用户清除**：点击"清除"按钮
   - 设置 `isUserCleared = true`
   - 显示数据的 min/max 日期
   - 移除过滤器

3. **度量值变化**：度量值改变时触发 `update()`
   - 如果 `isUserCleared = false`，检测并应用新的度量值
   - 如果度量值改变，更新输入框

4. **用户点击重置**：点击"重置"按钮
   - 清除 `isUserCleared` 标记（设为false）
   - 清除 `suppressDefaultRangeApply` 标记（设为false）
   - 应用当前的度量值

5. **页面切换回来**：从 `jsonFilters` 恢复之前的过滤器
   - 清除 `isUserCleared` 标记
   - 允许后续度量值变化更新选择器

## 测试场景

### 场景1：清除后显示正确的日期范围
1. 在报表中应用过滤器
2. 点击"清除"按钮
3. ✅ 输入框应显示数据的最小和最大日期

### 场景2：度量值改变时自动更新
1. 将两个度量值（开始日期、结束日期）拖入切片器
2. 在报表中改变其他过滤条件，导致度量值改变
3. ✅ 切片器的日期输入框应自动更新为新的度量值

### 场景3：清除后度量值变化不应用
1. 应用过滤器
2. 点击"清除"按钮
3. 改变报表条件使度量值改变
4. ✅ 切片器应保持清除状态，不被度量值变化影响

### 场景4：重置后恢复度量值监听
1. 点击"清除"按钮
2. 点击"重置"按钮
3. 改变报表条件使度量值改变
4. ✅ 切片器应自动应用新的度量值
