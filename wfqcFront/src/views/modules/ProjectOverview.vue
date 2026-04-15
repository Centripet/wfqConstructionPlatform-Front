<template>
  <div class="project-overview">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增项目
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
        <!-- 动态生成表格列 -->
        <el-table-column 
          v-for="column in tableColumns" 
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :fixed="column.fixed"
        >
          <template #default="scope">
            <!-- 支持单位后缀显示 -->
            <span v-if="column.suffix">
              {{ formatValueWithSuffix(scope.row[column.prop], column) }}
            </span>
            <!-- 支持自定义格式化函数 -->
            <span v-else-if="column.formatter">
              {{ column.formatter(scope.row) }}
            </span>
            <!-- 默认显示 -->
            <span v-else>
              {{ scope.row[column.prop] || '-' }}
            </span>
          </template>
        </el-table-column>
        
        <!-- 操作列单独处理 -->
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
      :title="isEdit ? '编辑项目' : '新增项目'"
      width="600px"
      draggable
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <!-- 动态生成表单字段 -->
        <el-form-item 
          v-for="field in formFields" 
          :key="field.prop"
          :label="field.label" 
          :prop="field.prop"
        >
          <!-- 根据不同字段类型渲染不同组件 -->
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
              v-for="item in field.options" 
              :key="item.value"
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="form[field.prop]"
            :type="field.dateType || 'date'"
            :placeholder="field.placeholder"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
          <div v-else-if="field.type === 'number'" style="display: flex; gap: 8px; width: 100%;">
            <el-input-number
              v-model="form[field.prop]" 
              :min="field.min || 0" 
              :precision="field.precision || 2" 
              style="flex: 1;" 
            />
            <span v-if="field.suffix" style="line-height: 32px; color: #909399;">{{ field.suffix }}</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    
    <AdvancedSearch
      v-model:visible="showAdvancedSearch"
      title="项目概览高级搜索"
      :search-fields="searchFields"
      @search="handleSearch"
    />
    
    <ExportDialog
      v-model:visible="showExportDialog"
      :total="total"
      :page-size="pageSize"
      :columns="exportColumns"
      :fetch-page-data="fetchExportData"
      default-filename="项目总览"
      @close="showExportDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Download } from '@element-plus/icons-vue'
import { projectApi } from '@/api/project'
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import ExportDialog from '@/components/ExportDialog.vue'

// ==================== 配置常量区域 ====================

// 状态配置
const STATUS_CONFIG = {
  0: { label: '进行中', type: 'primary' },
  1: { label: '已竣工', type: 'success' },
  2: { label: '已暂停', type: 'warning' }
  // 0: { label: '未开始', type: 'info' },
  // 1: { label: '进行中', type: 'primary' },
  // 2: { label: '已完成', type: 'success' },
  // 3: { label: '暂停', type: 'warning' }
}

// 状态选项
const statusOptions = Object.entries(STATUS_CONFIG).map(([value, config]) => ({
  value: Number(value),
  label: config.label
}))

// 高级搜索字段配置
const searchFields = [
  { prop: 'project_name', label: '项目名称', type: 'input', placeholder: '请输入项目名称' },
  { prop: 'cp_project_place', label: '项目地点', type: 'input', placeholder: '请输入项目地点' },
  { prop: 'cp_project_status', label: '项目状态', type: 'select', placeholder: '请选择项目状态', options: statusOptions },
  { prop: 'cp_project_manager', label: '项目经理', type: 'input', placeholder: '请输入项目经理' },
  { prop: 'cp_start_date', label: '开始日期', type: 'date', placeholder: '请选择开始日期' },
  { prop: 'cp_expected_completion_date', label: '预计完成日期', type: 'date', placeholder: '请选择预计完成日期' }
]

// 表格列配置
const tableColumns = [
  { prop: 'project_name', label: '项目名称', width: '200' },
  { prop: 'cp_project_place', label: '项目地点', width: '150' },
  { 
    prop: 'cp_project_status', 
    label: '项目状态', 
    width: '120',
    formatter: (row) => getStatusText(row.cp_project_status)
  },
  { prop: 'cp_project_manager', label: '项目经理', width: '120' },
  { 
    prop: 'cp_start_date', 
    label: '开始日期', 
    width: '120',
    formatter: (row) => row.cp_start_date || '-'
  },
  { 
    prop: 'cp_expected_completion_date', 
    label: '预计完成', 
    width: '120',
    formatter: (row) => row.cp_expected_completion_date || '-'
  },
  { 
    prop: 'cp_actual_completion_date', 
    label: '实际完成', 
    width: '120',
    formatter: (row) => row.cp_actual_completion_date || '-'
  },
  // 资金列添加单位后缀
  { 
    prop: 'cp_project_budget', 
    label: '项目预算', 
    width: '150',
    suffix: '万元',
    suffixPosition: 'right', // 后缀位置：left/right，默认right
    emptyValue: '-'
  },
  { 
    prop: 'cp_invested_funds', 
    label: '已投入资金', 
    width: '150',
    suffix: '万元',
    suffixPosition: 'right',
    emptyValue: '-'
  }
]

// 表单字段配置
const formFields = [
  { 
    prop: 'project_name', 
    label: '项目名称', 
    type: 'input', 
    placeholder: '请输入项目名称',
    required: true
  },
  { 
    prop: 'cp_project_place', 
    label: '项目地点', 
    type: 'input', 
    placeholder: '请输入项目地点',
    required: true
  },
  { 
    prop: 'cp_project_status', 
    label: '项目状态', 
    type: 'select', 
    placeholder: '请选择项目状态',
    options: statusOptions,
    required: true
  },
  { 
    prop: 'cp_project_manager', 
    label: '项目经理', 
    type: 'input', 
    placeholder: '请输入项目经理'
  },
  { 
    prop: 'cp_start_date', 
    label: '开始日期', 
    type: 'date', 
    placeholder: '请选择开始日期',
    dateType: 'date'
  },
  { 
    prop: 'cp_expected_completion_date', 
    label: '预计完成', 
    type: 'date', 
    placeholder: '请选择预计完成日期',
    dateType: 'date'
  },
  { 
    prop: 'cp_actual_completion_date', 
    label: '实际完成', 
    type: 'date', 
    placeholder: '请选择实际完成日期',
    dateType: 'date'
  },
  { 
    prop: 'cp_project_budget', 
    label: '项目预算', 
    type: 'number', 
    min: 0, 
    precision: 2,
    suffix: '万元'  // 表单中也显示单位
  },
  { 
    prop: 'cp_invested_funds', 
    label: '已投入资金', 
    type: 'number', 
    min: 0, 
    precision: 2,
    suffix: '万元'
  }
]

// 动态生成表单验证规则
const generateRules = () => {
  const rules = {}
  formFields.forEach(field => {
    if (field.required) {
      rules[field.prop] = [{ required: true, message: `请输入${field.label}`, trigger: 'blur' }]
    }
  })
  return rules
}

// 初始化表单数据
const getInitialFormData = () => {
  const formData = { project_id: '' }
  formFields.forEach(field => {
    if (field.type === 'number') {
      formData[field.prop] = 0
    } else if (field.type === 'select') {
      formData[field.prop] = field.options.length > 0 ? field.options[0].value : ''
    } else {
      formData[field.prop] = ''
    }
  })
  return formData
}

// ==================== 辅助函数 ====================

// 格式化带单位的值
const formatValueWithSuffix = (value, column) => {
  if (value === null || value === undefined || value === '') {
    return column.emptyValue || '-'
  }
  
  // 格式化数字，保留两位小数
  let formattedValue = value
  if (typeof value === 'number') {
    formattedValue = value.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
  
  const suffix = column.suffix || ''
  const position = column.suffixPosition || 'right'
  
  if (position === 'left') {
    return `${suffix}${formattedValue}`
  } else {
    return `${formattedValue}${suffix ? ' ' + suffix : ''}`
  }
}

const getStatusType = (status) => {
  return STATUS_CONFIG[status]?.type || 'info'
}

const getStatusText = (status) => {
  return STATUS_CONFIG[status]?.label || '未知'
}

// ==================== 响应式数据 ====================

const loading = ref(false)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref(getInitialFormData())
const rules = generateRules()

const showAdvancedSearch = ref(false)
const searchParams = ref({})
const showExportDialog = ref(false)

const exportColumns = [
  { prop: 'project_name', label: '项目名称' },
  { prop: 'cp_project_place', label: '项目地点' },
  { prop: 'cp_project_status', label: '项目状态', formatter: (row) => STATUS_CONFIG[row.cp_project_status]?.label || '未知' },
  { prop: 'cp_project_manager', label: '项目经理' },
  { prop: 'cp_start_date', label: '开始日期', formatter: (row) => row.cp_start_date || '-' },
  { prop: 'cp_expected_completion_date', label: '预计完成', formatter: (row) => row.cp_expected_completion_date || '-' },
  { prop: 'cp_actual_completion_date', label: '实际完成', formatter: (row) => row.cp_actual_completion_date || '-' },
  { prop: 'cp_project_budget', label: '项目预算', formatter: (row) => `${row.cp_project_budget || 0} 万元` },
  { prop: 'cp_invested_funds', label: '已投入资金', formatter: (row) => `${row.cp_invested_funds || 0} 万元` }
]

const fetchExportData = async (page, size) => {
  const params = {
    page,
    size,
    ...searchParams.value
  }
  const res = await projectApi.projectList(params)
  if (res.success) {
    return res.data?.records || []
  }
  return []
}

// ==================== API 调用 ====================

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...searchParams.value
    }
    const res = await projectApi.projectList(params)
    if (res.success) {
      tableData.value = res.data?.records || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.message || '加载数据失败')
    }
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
  form.value = getInitialFormData()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  const initialForm = getInitialFormData()
  form.value = { ...initialForm, ...row }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        if (isEdit.value) {
          res = await projectApi.projectModify(form.value)
        } else {
          res = await projectApi.projectSubmit(form.value)
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
    `确定要删除项目 "${row.project_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await projectApi.projectDelete({ project_id: row.project_id })
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
  loadData()
})
</script>

<style scoped>
.project-overview {
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

/* 表格中数字列右对齐优化 */
:deep(.el-table td:has([class*="suffix"])) {
  text-align: right;
}
</style>