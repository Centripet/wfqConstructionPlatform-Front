<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h3>项目总览</h3>
    </div>
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      @select="handleSelect"
    >
      <el-menu-item index="project">
        <el-icon><FolderOpened /></el-icon>
        <span>项目总览</span>
      </el-menu-item>
      <el-menu-item index="personnel">
        <el-icon><User /></el-icon>
        <span>人员管理</span>
      </el-menu-item>
      <el-menu-item index="equipment">
        <el-icon><Monitor /></el-icon>
        <span>设备监控</span>
      </el-menu-item>
      <el-menu-item index="progress">
        <el-icon><TrendCharts /></el-icon>
        <span>进度跟踪</span>
      </el-menu-item>
      <el-menu-item index="quality">
        <el-icon><CircleCheck /></el-icon>
        <span>质量检查</span>
      </el-menu-item>
      <el-menu-item index="safety">
        <el-icon><Warning /></el-icon>
        <span>安全管理</span>
      </el-menu-item>
      <el-menu-item index="materials">
        <el-icon><Box /></el-icon>
        <span>物资调配</span>
      </el-menu-item>
      <el-menu-item index="drawings">
        <el-icon><Document /></el-icon>
        <span>图纸管理</span>
      </el-menu-item>
      <el-menu-item index="analysis">
        <el-icon><DataAnalysis /></el-icon>
        <span>数据分析</span>
      </el-menu-item>
      <el-menu-item index="collaboration">
        <el-icon><ChatDotRound /></el-icon>
        <span>协作交流</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import { 
  User, 
  Monitor, 
  TrendCharts, 
  CircleCheck, 
  Warning, 
  Box, 
  Document, 
  DataAnalysis, 
  ChatDotRound,
  FolderOpened
} from '@element-plus/icons-vue'

const emit = defineEmits(['menu-select'])

const activeMenu = ref('project')

const handleSelect = (index) => {
  activeMenu.value = index
  emit('menu-select', index)
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.sidebar-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.sidebar-menu .el-menu-item:hover {
  background-color: #f5f7fa;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #ecf5ff;
  color: #409eff;
}
</style>
