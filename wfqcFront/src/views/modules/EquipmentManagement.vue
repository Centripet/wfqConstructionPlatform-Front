<template>
  <div class="equipment-management">
    <PieChart 
      :data="chartData" 
      :size="220"
      :field-options="fieldOptions"
      :default-field="'device_type'"
      @field-change="handleFieldChange"
    />
    
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加设备
      </el-button>
      <div class="toolbar-right">
        <el-button @click="showAdvancedSearch = true">
          <el-icon><Search /></el-icon>
          高级搜索
        </el-button>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="showExportDialog = true">
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
      </div>
    </div>
    
    <div class="content-wrapper">
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column 
          v-for="column in tableColumns" 
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :fixed="column.fixed"
        >
          <template #default="scope">
            <el-tag 
              v-if="column.tagType" 
              :type="column.tagType(scope.row[column.prop])"
            >
              {{ column.formatter ? column.formatter(scope.row) : (scope.row[column.prop] || '-') }}
            </el-tag>
            <span v-else-if="column.formatter">
              {{ column.formatter(scope.row) }}
            </span>
            <span v-else>
              {{ scope.row[column.prop] || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>
    
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设备' : '添加设备'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item 
          v-for="field in formFields" 
          :key="field.prop"
          :label="field.label" 
          :prop="field.prop"
        >
          <el-input 
            v-if="field.type === 'input'"
            v-model="form[field.prop]" 
            :placeholder="field.placeholder" 
          />
          <el-select 
            v-else-if="field.type === 'select'"
            v-model="form[field.prop]" 
            :placeholder="field.placeholder" 
            style="width: 100%;"
          >
            <el-option 
              v-for="item in (field.optionsKey === 'projectList' ? projectList : field.options)" 
              :key="item[field.optionValue || 'value']"
              :label="item[field.optionLabel || 'label']" 
              :value="item[field.optionValue || 'value']" 
            />
          </el-select>
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="form[field.prop]"
            :type="field.dateType || 'date'"
            :placeholder="field.placeholder"
            style="width: 100%;"
            :value-format="field.valueFormat || 'YYYY-MM-DD'"
          />
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="form[field.prop]" 
            :min="field.min || 0" 
            :max="field.max" 
            :precision="field.precision" 
            style="width: 100%;" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    
    <AdvancedSearch
      v-model:visible="showAdvancedSearch"
      title="设备高级搜索"
      :search-fields="getSearchFieldsWithOptions()"
      @search="handleSearch"
    />
    
    <ExportDialog
      v-model:visible="showExportDialog"
      :total="total"
      :page-size="pageSize"
      :columns="exportColumns"
      :fetch-page-data="fetchExportData"
      default-filename="设备监控"
      @close="showExportDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Download } from '@element-plus/icons-vue'
import { deviceApi } from '@/api/device'
import { projectApi } from '@/api/project'
import PieChart from '@/components/PieChart.vue'
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import ExportDialog from '@/components/ExportDialog.vue'

// ==================== 配置常量区域 ====================

const DEVICE_STATUS_CONFIG = {
  0: { label: '正常', type: 'success' },
  1: { label: '离线', type: 'info' },
  2: { label: '异常', type: 'danger' }
  // 0: { label: '闲置', type: 'info' },
  // 1: { label: '使用中', type: 'success' },
  // 2: { label: '维修中', type: 'warning' },
  // 3: { label: '报废', type: 'danger' }
}

const ALARM_STATUS_CONFIG = {
  0: { label: '正常', type: 'success' },
  1: { label: '告警', type: 'danger' }
}

const deviceStatusOptions = Object.entries(DEVICE_STATUS_CONFIG).map(([value, config]) => ({
  value: Number(value),
  label: config.label
}))

const alarmStatusOptions = [
  { value: 0, label: '正常' },
  { value: 1, label: '告警' }
]

const searchFields = [
  { prop: 'project_id', label: '所属项目', type: 'select', placeholder: '请选择项目', optionsKey: 'projectList', optionLabel: 'project_name', optionValue: 'project_id' },
  { prop: 'device_name', label: '设备名称', type: 'input', placeholder: '请输入设备名称' },
  { prop: 'device_type', label: '设备类型', type: 'input', placeholder: '请输入设备类型' },
  { prop: 'device_status', label: '设备状态', type: 'select', placeholder: '请选择设备状态', options: deviceStatusOptions },
  { prop: 'device_location', label: '设备位置', type: 'input', placeholder: '请输入设备位置' },
  { prop: 'running_time', label: '运行时间(小时)', type: 'number', min: 0, placeholder: '请输入运行时间' },
  { prop: 'battery', label: '电量(%)', type: 'number', min: 0, max: 100 },
  { prop: 'alarm_status', label: '报警状态', type: 'select', placeholder: '请选择报警状态', options: alarmStatusOptions },
  { prop: 'last_maintenance_time', label: '上次维护时间', type: 'date', placeholder: '请选择上次维护时间' }
]

const tableColumns = [
  { 
    prop: 'project_id', 
    label: '所属项目', 
    width: '150',
    formatter: (row, projectList) => getProjectName(row.project_id, projectList)
  },
  { prop: 'device_name', label: '设备名称', width: '180' },
  { prop: 'device_type', label: '设备类型', width: '120' },
  { 
    prop: 'device_status', 
    label: '设备状态', 
    width: '120',
    tagType: (val) => DEVICE_STATUS_CONFIG[val]?.type || 'info',
    formatter: (row) => DEVICE_STATUS_CONFIG[row.device_status]?.label || '未知'
  },
  { prop: 'device_location', label: '设备位置', width: '150' },
  { 
    prop: 'running_time', 
    label: '运行时间', 
    width: '120',
    formatter: (row) => row.running_time !== undefined && row.running_time !== null ? `${Math.floor(row.running_time)} 小时` : '-'
  },
  { prop: 'battery', label: '电量(%)', width: '100' },
  { prop: 'temperature', label: '温度(°C)', width: '120' },
  { 
    prop: 'alarm_status', 
    label: '报警状态', 
    width: '120',
    tagType: (val) => ALARM_STATUS_CONFIG[val]?.type || 'info',
    formatter: (row) => ALARM_STATUS_CONFIG[row.alarm_status]?.label || '未知'
  },
  { 
    prop: 'last_maintenance_time', 
    label: '上次维护', 
    width: '120',
    formatter: (row) => row.last_maintenance_time || '-'
  }
]

const formFields = [
  { 
    prop: 'project_id', 
    label: '所属项目', 
    type: 'select', 
    placeholder: '请选择项目',
    optionsKey: 'projectList',
    optionLabel: 'project_name',
    optionValue: 'project_id',
    required: true
  },
  { 
    prop: 'device_name', 
    label: '设备名称', 
    type: 'input', 
    placeholder: '请输入设备名称',
    required: true
  },
  { 
    prop: 'device_type', 
    label: '设备类型', 
    type: 'input', 
    placeholder: '请输入设备类型'
  },
  { 
    prop: 'device_status', 
    label: '设备状态', 
    type: 'select', 
    placeholder: '请选择设备状态',
    options: deviceStatusOptions
  },
  { 
    prop: 'device_location', 
    label: '设备位置', 
    type: 'input', 
    placeholder: '请输入设备位置'
  },
  { 
    prop: 'running_time', 
    label: '运行时间(小时)', 
    type: 'number', 
    min: 0,
    placeholder: '请输入运行时间'
  },
  { 
    prop: 'battery', 
    label: '电量(%)', 
    type: 'number', 
    min: 0,
    max: 100,
    placeholder: '请输入电量'
  },
  { 
    prop: 'temperature', 
    label: '温度(°C)', 
    type: 'number', 
    precision: 1,
    placeholder: '请输入温度'
  },
  { 
    prop: 'alarm_status', 
    label: '报警状态', 
    type: 'select', 
    placeholder: '请选择报警状态',
    options: alarmStatusOptions
  },
  { 
    prop: 'last_maintenance_time', 
    label: '上次维护', 
    type: 'date', 
    placeholder: '请选择上次维护时间',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD'
  }
]

const generateRules = () => {
  const rules = {}
  formFields.forEach(field => {
    if (field.required) {
      rules[field.prop] = [{ required: true, message: `请输入${field.label}`, trigger: field.type === 'select' ? 'change' : 'blur' }]
    }
  })
  return rules
}

const getInitialFormData = () => {
  const formData = { device_id: '' }
  formFields.forEach(field => {
    if (field.type === 'number') {
      formData[field.prop] = field.min || 0
    } else if (field.type === 'select') {
      formData[field.prop] = field.options ? field.options[0]?.value : ''
    } else {
      formData[field.prop] = ''
    }
  })
  return formData
}

// ==================== 辅助函数 ====================

const getProjectName = (projectId, projectList) => {
  const project = projectList?.find(p => p.project_id === projectId)
  return project ? project.project_name : '-'
}

// ==================== 响应式数据 ====================

const loading = ref(false)
const tableData = ref([])
const projectList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref(getInitialFormData())
const rules = generateRules()
const chartData = ref([])
const currentField = ref('device_type')

const showAdvancedSearch = ref(false)
const searchParams = ref({})
const showExportDialog = ref(false)

const exportColumns = [
  { prop: 'project_id', label: '所属项目', formatter: (row) => getProjectName(row.project_id, projectList.value) },
  { prop: 'device_name', label: '设备名称' },
  { prop: 'device_type', label: '设备类型' },
  { prop: 'device_status', label: '设备状态', formatter: (row) => DEVICE_STATUS_CONFIG[row.device_status]?.label || '未知' },
  { prop: 'device_location', label: '设备位置' },
  { prop: 'running_time', label: '运行时间', formatter: (row) => row.running_time !== undefined && row.running_time !== null ? `${Math.floor(row.running_time)} 小时` : '-' },
  { prop: 'battery', label: '电量(%)' },
  { prop: 'temperature', label: '温度(°C)' },
  { prop: 'alarm_status', label: '报警状态', formatter: (row) => ALARM_STATUS_CONFIG[row.alarm_status]?.label || '未知' },
  { prop: 'last_maintenance_time', label: '上次维护', formatter: (row) => row.last_maintenance_time || '-' }
]

const fetchExportData = async (page, size) => {
  const params = {
    page,
    size,
    ...searchParams.value
  }
  const res = await deviceApi.deviceList(params)
  if (res.success) {
    return res.data?.records || []
  }
  return []
}

const getSearchFieldsWithOptions = () => {
  return searchFields.map(field => {
    if (field.optionsKey === 'projectList') {
      return { ...field, options: projectList.value.map(p => ({ value: p.project_id, label: p.project_name })) }
    }
    return field
  })
}

const fieldOptions = [
  { label: '设备名称', value: 'device_name' },
  { label: '设备类型', value: 'device_type' },
  { label: '设备状态', value: 'device_status' }
]

// ==================== API 调用 ====================

const loadProjects = async () => {
  try {
    const res = await projectApi.projectList({ page: 1, size: 100 })
    if (res.success) {
      projectList.value = res.data?.records || res.data?.list || res.data || []
    }
  } catch (error) {
    console.error('加载项目列表失败:', error)
  }
}

const loadChartData = async (field = currentField.value) => {
  try {
    const res = await deviceApi.deviceCount({ field })
    if (res.success) {
      chartData.value = res.data || []
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handleFieldChange = (field) => {
  currentField.value = field
  loadChartData(field)
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...searchParams.value
    }
    const res = await deviceApi.deviceList(params)
    if (res.success) {
      tableData.value = res.data?.records || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.message || '加载数据失败')
    }
    await loadChartData()
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = (params) => {
  searchParams.value = params
  currentPage.value = 1
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  const initialForm = getInitialFormData()
  form.value = { ...initialForm, project_id: selectedProjectId.value || '' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        if (isEdit.value) {
          res = await deviceApi.deviceModify(form.value)
        } else {
          res = await deviceApi.deviceSubmit(form.value)
        }
        if (res.success) {
          ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
          dialogVisible.value = false
          loadData()
        } else {
          ElMessage.error(res.message || '操作失败')
        }
      } catch {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除设备 "${row.device_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await deviceApi.deviceDelete({ device_id: row.device_id })
      if (res.success) {
        ElMessage.success('删除成功')
        loadData()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch {
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

onMounted(() => {
  loadProjects()
  loadData()
  loadChartData()
})
</script>

<style scoped>
.equipment-management {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.search-bar .el-select {
  width: 300px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

:deep(.el-table__cell) {
  padding: 12px 0;
  height: 50px;
  line-height: 26px;
}
</style>
