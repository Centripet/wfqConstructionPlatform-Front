<template>
  <div class="content-area">
    <div class="content-header">
      <h2>{{ currentTitle }}</h2>
    </div>
    <div class="content-body">
      <component :is="currentComponent" :module-name="currentTitle" />
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import ProjectOverview from '@/views/modules/ProjectOverview.vue'
import EquipmentManagement from '@/views/modules/EquipmentManagement.vue'
import ProgressTracking from '@/views/modules/ProgressTracking.vue'
import QualityInspection from '@/views/modules/QualityInspection.vue'
import SafetyManagement from '@/views/modules/SafetyManagement.vue'
import MaterialAllocation from '@/views/modules/MaterialAllocation.vue'
import DrawingManagement from '@/views/modules/DrawingManagement.vue'
import DataAnalysis from '@/views/modules/DataAnalysis.vue'
import Collaboration from '@/views/modules/Collaboration.vue'
import PlaceholderModule from '@/views/modules/PlaceholderModule.vue'

const props = defineProps({
  activeMenu: {
    type: String,
    default: 'project'
  }
})

const menuTitles = {
  project: '项目总览',
  personnel: '人员管理',
  equipment: '设备监控',
  progress: '进度跟踪',
  quality: '质量检查',
  safety: '安全管理',
  materials: '物资调配',
  drawings: '图纸管理',
  analysis: '数据分析',
  collaboration: '协作交流'
}

const menuComponents = {
  project: ProjectOverview,
  personnel: PlaceholderModule,
  equipment: EquipmentManagement,
  progress: ProgressTracking,
  quality: QualityInspection,
  safety: SafetyManagement,
  materials: MaterialAllocation,
  drawings: DrawingManagement,
  analysis: DataAnalysis,
  collaboration: Collaboration
}

const currentTitle = computed(() => {
  return menuTitles[props.activeMenu] || '人员管理'
})

const currentComponent = computed(() => {
  return menuComponents[props.activeMenu] || PlaceholderModule
})
</script>

<style scoped>
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  overflow: hidden;
}

.content-header {
  padding: 20px 24px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.content-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
