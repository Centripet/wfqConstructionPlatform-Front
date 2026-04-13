<template>
  <div class="safety-management">
    <PieChart 
      :data="chartData" 
      :size="220"
      :field-options="fieldOptions"
      :default-field="'event_level'"
      @field-change="handleFieldChange"
    />
    
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加事件
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
      :title="isEdit ? '编辑事件' : '添加事件'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="130px">
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
            :format="field.format"
          />
          <el-input 
            v-else-if="field.type === 'textarea'"
            v-model="form[field.prop]" 
            type="textarea" 
            :rows="field.rows || 3"
            :placeholder="field.placeholder" 
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
      title="安全事件高级搜索"
      :search-fields="getSearchFieldsWithOptions()"
      @search="handleSearch"
    />
    
    <ExportDialog
      v-model:visible="showExportDialog"
      :total="total"
      :page-size="pageSize"
      :columns="exportColumns"
      :fetch-page-data="fetchExportData"
      default-filename="安全管理"
      @close="showExportDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Download } from '@element-plus/icons-vue'
import { safetyEventApi } from '@/api/safetyEvent'
import { projectApi } from '@/api/project'
import PieChart from '@/components/PieChart.vue'
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import ExportDialog from '@/components/ExportDialog.vue'

// ==================== 配置常量区域 ====================

const EVENT_LEVEL_CONFIG = {
  0: { label: '一般', type: 'info' },
  1: { label: '严重', type: 'warning' },
  2: { label: '重大', type: 'danger' }
  // ,3: { label: '特别重大', type: 'danger' }
}

const PROCESSING_STATUS_CONFIG = {
  0: { label: '处理中', type: 'warning' },
  1: { label: '已完成', type: 'success' },
  // 0: { label: '待处理', type: 'info' },
  // 1: { label: '处理中', type: 'warning' },
  // 2: { label: '已完成', type: 'success' }
}

const eventLevelOptions = Object.entries(EVENT_LEVEL_CONFIG).map(([value, config]) => ({
  value: Number(value),
  label: config.label
}))

const processingStatusOptions = Object.entries(PROCESSING_STATUS_CONFIG).map(([value, config]) => ({
  value: Number(value),
  label: config.label
}))

const searchFields = [
  { prop: 'project_id', label: '所属项目', type: 'select', placeholder: '请选择项目', optionsKey: 'projectList', optionLabel: 'project_name', optionValue: 'project_id' },
  { prop: 'event_name', label: '事件名称', type: 'input', placeholder: '请输入事件名称' },
  { prop: 'occurrence_time', label: '发生时间', type: 'date', placeholder: '请选择发生时间' },
  { prop: 'occurrence_place', label: '发生地点', type: 'input', placeholder: '请输入发生地点' },
  { prop: 'responsible_person', label: '责任人', type: 'input', placeholder: '请输入责任人' },
  { prop: 'event_level', label: '事件等级', type: 'select', placeholder: '请选择事件等级', options: eventLevelOptions },
  { prop: 'processing_status', label: '处理状态', type: 'select', placeholder: '请选择处理状态', options: processingStatusOptions }
]

const tableColumns = [
  { 
    prop: 'project_id', 
    label: '所属项目', 
    width: '150',
    formatter: (row, projectList) => getProjectName(row.project_id, projectList)
  },
  { prop: 'event_name', label: '事件名称', width: '180' },
  { 
    prop: 'occurrence_time', 
    label: '发生时间', 
    width: '180',
    formatter: (row) => formatDateTime(row.occurrence_time)
  },
  { prop: 'occurrence_place', label: '发生地点', width: '150' },
  { prop: 'responsible_person', label: '责任人', width: '120' },
  { 
    prop: 'event_level', 
    label: '事件等级', 
    width: '100',
    tagType: (val) => EVENT_LEVEL_CONFIG[val]?.type || 'info',
    formatter: (row) => EVENT_LEVEL_CONFIG[row.event_level]?.label || '未知'
  },
  { 
    prop: 'processing_status', 
    label: '处理状态', 
    width: '100',
    tagType: (val) => PROCESSING_STATUS_CONFIG[val]?.type || 'info',
    formatter: (row) => PROCESSING_STATUS_CONFIG[row.processing_status]?.label || '未知'
  },
  { prop: 'rectification_measures', label: '整改措施', showOverflowTooltip: true },
  { 
    prop: 'rectification_completion_time', 
    label: '整改完成时间', 
    width: '180',
    formatter: (row) => formatDateTime(row.rectification_completion_time)
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
    prop: 'event_name', 
    label: '事件名称', 
    type: 'input', 
    placeholder: '请输入事件名称',
    required: true
  },
  { 
    prop: 'occurrence_time', 
    label: '发生时间', 
    type: 'date', 
    placeholder: '请选择发生时间',
    dateType: 'datetime',
    valueFormat: 'YYYY-MM-DDTHH:mm:ss',
    format: 'YYYY-MM-DD HH:mm:ss',
    required: true
  },
  { 
    prop: 'occurrence_place', 
    label: '发生地点', 
    type: 'input', 
    placeholder: '请输入发生地点',
    required: true
  },
  { 
    prop: 'responsible_person', 
    label: '责任人', 
    type: 'input', 
    placeholder: '请输入责任人',
    required: true
  },
  { 
    prop: 'event_level', 
    label: '事件等级', 
    type: 'select', 
    placeholder: '请选择事件等级',
    options: eventLevelOptions,
    required: true
  },
  { 
    prop: 'processing_status', 
    label: '处理状态', 
    type: 'select', 
    placeholder: '请选择处理状态',
    options: processingStatusOptions,
    required: true
  },
  { 
    prop: 'rectification_measures', 
    label: '整改措施', 
    type: 'textarea', 
    placeholder: '请输入整改措施',
    rows: 3
  },
  { 
    prop: 'rectification_completion_time', 
    label: '整改完成时间', 
    type: 'date', 
    placeholder: '请选择整改完成时间',
    dateType: 'datetime',
    valueFormat: 'YYYY-MM-DDTHH:mm:ss',
    format: 'YYYY-MM-DD HH:mm:ss'
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
  const formData = { event_id: '' }
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

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return datetime
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
const currentField = ref('event_level')

const showAdvancedSearch = ref(false)
const searchParams = ref({})
const showExportDialog = ref(false)

const exportColumns = [
  { prop: 'project_id', label: '所属项目', formatter: (row) => getProjectName(row.project_id, projectList.value) },
  { prop: 'event_name', label: '事件名称' },
  { prop: 'occurrence_time', label: '发生时间', formatter: (row) => formatDateTime(row.occurrence_time) },
  { prop: 'occurrence_place', label: '发生地点' },
  { prop: 'responsible_person', label: '责任人' },
  { prop: 'event_level', label: '事件等级', formatter: (row) => EVENT_LEVEL_CONFIG[row.event_level]?.label || '未知' },
  { prop: 'processing_status', label: '处理状态', formatter: (row) => PROCESSING_STATUS_CONFIG[row.processing_status]?.label || '未知' },
  { prop: 'rectification_measures', label: '整改措施' },
  { prop: 'rectification_completion_time', label: '整改完成时间', formatter: (row) => formatDateTime(row.rectification_completion_time) }
]

const fetchExportData = async (page, size) => {
  const params = {
    page,
    size,
    ...searchParams.value
  }
  const res = await safetyEventApi.safetyEventList(params)
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
  { label: '事件名称', value: 'event_name' },
  { label: '事件等级', value: 'event_level' },
  { label: '处理状态', value: 'processing_status' }
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
    const res = await safetyEventApi.safetyEventCount({ field })
    if (res.success) {
      const levelConfig = {
        0: '一般',
        1: '严重',
        2: '重大'
      }
      chartData.value = (res.data || []).map(item => {
        const name = item[field] || item.event_level_label || levelConfig[item.event_level] || `等级${item.event_level}` || '未知'
        return {
          ...item,
          name: typeof name === 'number' ? `等级${name}` : name,
          count: item.count || 0
        }
      })
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
    const res = await safetyEventApi.safetyEventList(params)
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
  form.value = { ...initialForm, project_id: searchParams.value.project_id || '' }
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
          res = await safetyEventApi.safetyEventModify(form.value)
        } else {
          res = await safetyEventApi.safetyEventSubmit(form.value)
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
    `确定要删除事件 "${row.event_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await safetyEventApi.safetyEventDelete({ event_id: row.event_id })
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
.safety-management {
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
