<template>
  <div class="quality-inspection">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加检查
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
      :title="isEdit ? '编辑检查' : '添加检查'"
      width="600px"
      draggable
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
      title="质量检查高级搜索"
      :search-fields="getSearchFieldsWithOptions()"
      @search="handleSearch"
    />
    
    <ExportDialog
      v-model:visible="showExportDialog"
      :total="total"
      :page-size="pageSize"
      :columns="exportColumns"
      :fetch-page-data="fetchExportData"
      default-filename="质量检查"
      @close="showExportDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Download } from '@element-plus/icons-vue'
import { qualityInsApi } from '@/api/qualityIns'
import { projectApi } from '@/api/project'
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import ExportDialog from '@/components/ExportDialog.vue'

// ==================== 配置常量区域 ====================

const INSPECTION_RESULT_CONFIG = {
  0: { label: '合格', type: 'success' },
  1: { label: '不合格', type: 'danger' }
}

const inspectionResultOptions = [
  { value: 1, label: '不合格' },
  { value: 0, label: '合格' }
]

const searchFields = [
  { prop: 'project_id', label: '所属项目', type: 'select', placeholder: '请选择项目', optionsKey: 'projectList', optionLabel: 'project_name', optionValue: 'project_id' },
  { prop: 'inspection_item', label: '检查项目', type: 'input', placeholder: '请输入检查项目' },
  { prop: 'inspection_standard', label: '检查标准', type: 'input', placeholder: '请输入检查标准' },
  { prop: 'inspector', label: '检查人员', type: 'input', placeholder: '请输入检查人员' },
  { prop: 'inspection_time', label: '检查时间', type: 'date', placeholder: '请选择检查时间' },
  { prop: 'inspection_result', label: '检查结果', type: 'select', placeholder: '请选择检查结果', options: inspectionResultOptions }
]

const tableColumns = [
  { 
    prop: 'project_id', 
    label: '所属项目', 
    width: '150',
    formatter: (row, projectList) => getProjectName(row.project_id, projectList)
  },
  { prop: 'inspection_item', label: '检查项目', width: '180' },
  { prop: 'inspection_standard', label: '检查标准', width: '180' },
  { 
    prop: 'inspection_result', 
    label: '检查结果', 
    width: '120',
    tagType: (val) => INSPECTION_RESULT_CONFIG[val]?.type || 'info',
    formatter: (row) => INSPECTION_RESULT_CONFIG[row.inspection_result]?.label || '未知'
  },
  { prop: 'inspector', label: '检查人', width: '120' },
  { 
    prop: 'inspection_time', 
    label: '检查时间', 
    width: '120',
    formatter: (row) => row.inspection_time || '-'
  },
  { prop: 'rectification_requirement', label: '整改要求', showOverflowTooltip: true },
  { prop: 'rectification_responsible', label: '整改负责人', width: '120' },
  { 
    prop: 'rectification_completion_time', 
    label: '整改完成时间', 
    width: '140',
    formatter: (row) => row.rectification_completion_time || '-'
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
    prop: 'inspection_item', 
    label: '检查项目', 
    type: 'input', 
    placeholder: '请输入检查项目',
    required: true
  },
  { 
    prop: 'inspection_standard', 
    label: '检查标准', 
    type: 'input', 
    placeholder: '请输入检查标准',
    required: true
  },
  { 
    prop: 'inspection_result', 
    label: '检查结果', 
    type: 'select', 
    placeholder: '请选择检查结果',
    options: inspectionResultOptions,
    required: true
  },
  { 
    prop: 'inspector', 
    label: '检查人', 
    type: 'input', 
    placeholder: '请输入检查人'
  },
  { 
    prop: 'inspection_time', 
    label: '检查时间', 
    type: 'date', 
    placeholder: '请选择检查时间',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD'
  },
  { 
    prop: 'rectification_requirement', 
    label: '整改要求', 
    type: 'textarea', 
    placeholder: '请输入整改要求',
    rows: 3
  },
  { 
    prop: 'rectification_responsible', 
    label: '整改负责人', 
    type: 'input', 
    placeholder: '请输入整改负责人'
  },
  { 
    prop: 'rectification_completion_time', 
    label: '整改完成时间', 
    type: 'date', 
    placeholder: '请选择整改完成时间',
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
  const formData = { quality_id: '' }
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

const showAdvancedSearch = ref(false)
const searchParams = ref({})
const showExportDialog = ref(false)

const exportColumns = [
  { prop: 'project_id', label: '所属项目', formatter: (row) => getProjectName(row.project_id, projectList.value) },
  { prop: 'inspection_item', label: '检查项目' },
  { prop: 'inspection_standard', label: '检查标准' },
  { prop: 'inspection_result', label: '检查结果', formatter: (row) => INSPECTION_RESULT_CONFIG[row.inspection_result]?.label || '未知' },
  { prop: 'inspector', label: '检查人' },
  { prop: 'inspection_time', label: '检查时间', formatter: (row) => row.inspection_time || '-' },
  { prop: 'rectification_requirement', label: '整改要求' },
  { prop: 'rectification_responsible', label: '整改负责人' },
  { prop: 'rectification_completion_time', label: '整改完成时间', formatter: (row) => row.rectification_completion_time || '-' }
]

const fetchExportData = async (page, size) => {
  const params = {
    page,
    size,
    ...searchParams.value
  }
  const res = await qualityInsApi.qualityInsList(params)
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

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...searchParams.value
    }
    const res = await qualityInsApi.qualityInsList(params)
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
          res = await qualityInsApi.qualityInsModify(form.value)
        } else {
          res = await qualityInsApi.qualityInsSubmit(form.value)
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
    `确定要删除检查 "${row.inspection_item}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await qualityInsApi.qualityInsDelete({ quality_id: row.quality_id })
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
})
</script>

<style scoped>
.quality-inspection {
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
