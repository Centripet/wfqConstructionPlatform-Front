<template>
  <div class="pie-chart-container">
    <div class="chart-header">
      <div class="field-selector">
        <el-select 
          v-model="selectedField" 
          placeholder="请选择统计字段"
          class="field-select"
          @change="handleFieldChange"
        >
          <el-option
            v-for="option in fieldOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>
      <el-button 
        type="text" 
        @click="toggleChart"
        class="toggle-btn"
      >
        <el-icon>
          <ArrowUp v-if="isExpanded" />
          <ArrowDown v-else />
        </el-icon>
        {{ isExpanded ? '隐藏图表' : '展开图表' }}
      </el-button>
    </div>
    
    <transition name="slide-fade">
      <div v-show="isExpanded" class="chart-content">
        <div class="chart-wrapper">
          <div ref="chartRef" class="chart-container"></div>
          <div class="legend">
            <div class="legend-summary">
              <span class="summary-label">统计总数</span>
              <span class="summary-value">{{ total }}</span>
            </div>
            <div 
              v-for="(item, index) in chartData" 
              :key="index"
              class="legend-item"
              :class="{ 'legend-item-hover': hoveredIndex === index }"
              @mouseenter="handleLegendHover(index)"
              @mouseleave="handleLegendLeave"
            >
              <span class="legend-color" :style="{ backgroundColor: colors[index % colors.length] }"></span>
              <span class="legend-label">{{ item.name }}</span>
              <span class="legend-count">{{ item.count }}</span>
              <span class="legend-percent">{{ getPercent(item.count) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
const props = defineProps({
 title: {
 type: String,
 default: '数据统计'
 },
 data: {
 type: Array,
 default: () => []
 },
 fieldOptions: {
 type: Array,
 default: () => []
 },
 defaultField: {
 type: String,
 default: ''
 }
});
const emit = defineEmits(['fieldChange']);
const colors = [
 '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
 '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#48b8d0'
];
const isExpanded = ref(true);
const hoveredIndex = ref(null);
const selectedField = ref(props.defaultField || (props.fieldOptions.length > 0 ? props.fieldOptions[0].value : ''));
const chartRef = ref(null);
let chartInstance = null;
const chartData = computed(() => {
 return props.data.map(item => ({
 name: item[selectedField.value] || item.role || item.device_type || item.event_level_label || item.name || '未知',
 count: item.count || 0,
 rawItem: item
 }));
});
const total = computed(() => {
 return chartData.value.reduce((sum, item) => sum + item.count, 0);
});
const getPercent = (count) => {
 if (total.value === 0)
 return '0.00';
 return ((count / total.value) * 100).toFixed(2);
};
const toggleChart = () => {
 isExpanded.value = !isExpanded.value;
 if (isExpanded.value) {
 nextTick(() => {
 initChart();
 });
 }
};
const handleFieldChange = (field) => {
 emit('fieldChange', field);
};
const handleLegendHover = (index) => {
 hoveredIndex.value = index;
 if (chartInstance) {
 chartInstance.dispatchAction({
 type: 'highlight',
 seriesIndex: 0,
 dataIndex: index
 });
 }
};
const handleLegendLeave = () => {
 hoveredIndex.value = null;
 if (chartInstance) {
 chartInstance.dispatchAction({
 type: 'downplay',
 seriesIndex: 0
 });
 }
};
const initChart = () => {
 if (!chartRef.value)
 return;
 if (chartInstance) {
 chartInstance.dispose();
 }
 chartInstance = echarts.init(chartRef.value);
 const option = {
 tooltip: {
 trigger: 'item',
 formatter: '{b}: {c} ({d}%)'
 },
 series: [
 {
 name: '统计数据',
 type: 'pie',
 radius: ['40%', '70%'],
 center: ['50%', '50%'],
 avoidLabelOverlap: false,
 itemStyle: {
 borderRadius: 8,
 borderColor: '#fff',
 borderWidth: 2
 },
 label: {
 show: true,
 formatter: '{b}\n{c}',
 fontSize: 12,
 fontWeight: 'bold'
 },
 labelLine: {
 show: true,
 length: 20,
 length2: 30,
 smooth: true
 },
 emphasis: {
 label: {
 show: true,
 fontSize: 14,
 fontWeight: 'bold'
 },
 itemStyle: {
 shadowBlur: 10,
 shadowOffsetX: 0,
 shadowColor: 'rgba(0, 0, 0, 0.5)'
 }
 },
 data: chartData.value.map((item, index) => ({
 value: item.count,
 name: item.name,
 itemStyle: {
 color: colors[index % colors.length]
 }
 }))
 }
 ]
 };
 chartInstance.setOption(option);
};
const handleResize = () => {
 if (chartInstance && isExpanded.value) {
 chartInstance.resize();
 }
};
watch(() => props.data, () => {
 if (isExpanded.value) {
 initChart();
 }
}, { deep: true });
watch(selectedField, () => {
 hoveredIndex.value = null;
});
onMounted(() => {
 if (isExpanded.value) {
 nextTick(() => {
 initChart();
 });
 }
 window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
 if (chartInstance) {
 chartInstance.dispose();
 chartInstance = null;
 }
 window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.pie-chart-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.field-selector {
  flex: 1;
}

.field-select {
  width: 200px;
}

.toggle-btn {
  font-size: 12px;
  color: #606266;
  padding: 0;
}

.toggle-btn:hover {
  color: #409eff;
}

.chart-content {
  padding-top: 16px;
}

.chart-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 40px;
  flex-wrap: wrap;
}

.chart-container {
  width: 768px;
  height: 280px;
  flex-shrink: 0;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-width: 250px;
}

.legend-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.summary-label {
  font-size: 14px;
  color: #606266;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.legend-item:hover,
.legend-item-hover {
  background: #f5f7fa;
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  font-size: 13px;
  color: #606266;
}

.legend-count {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  min-width: 35px;
  text-align: right;
}

.legend-percent {
  font-size: 12px;
  color: #909399;
  min-width: 55px;
  text-align: right;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  max-height: 400px;
}
</style>