<template>
  <div class="data-analysis">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加分析
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
            <span v-if="column.formatter">
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
      :title="isEdit ? '编辑数据分析' : '添加数据分析'"
      width="600px"
      draggable
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
            :min="field.min" 
            :max="field.max"
            :precision="field.precision" 
            style="width: 100%;" 
          />
          <el-input 
            v-else-if="field.type === 'textarea'"
            v-model="form[field.prop]" 
            type="textarea" 
            :rows="field.rows || 3"
            :placeholder="field.placeholder" 
          />
          <SingleFileUploader
            v-else-if="field.type === 'file'"
            v-model="form[field.prop]"
            :file-data="currentFileInfo"
            :file-type="3"
            @change="handleFileChange"
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
      title="数据分析高级搜索"
      :search-fields="searchFields"
      @search="handleSearch"
    />
    
    <ExportDialog
      v-model:visible="showExportDialog"
      :total="total"
      :page-size="pageSize"
      :columns="exportColumns"
      :fetch-page-data="fetchExportData"
      default-filename="数据分析"
      @close="showExportDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Download } from '@element-plus/icons-vue'
import { dataAnalysisApi } from '@/api/dataAnalysis'
import { fileApi } from '@/api/file'
import SingleFileUploader from '@/components/SingleFileUploader.vue'
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import ExportDialog from '@/components/ExportDialog.vue'

// ==================== 配置常量区域 ====================

const searchFields = [
  { prop: 'data_source', label: '数据来源', type: 'input', placeholder: '请输入数据来源' },
  { prop: 'data_type', label: '数据类型', type: 'input', placeholder: '请输入数据类型' },
  { prop: 'collection_time', label: '采集时间', type: 'date', placeholder: '请选择采集时间' },
  { prop: 'data_description', label: '数据描述', type: 'input', placeholder: '请输入数据描述' },
  { prop: 'analysis_method', label: '分析方法', type: 'input', placeholder: '请输入分析方法' },
  { prop: 'analyst', label: '分析师', type: 'input', placeholder: '请输入分析师' },
  { prop: 'analysis_period', label: '分析周期', type: 'input', placeholder: '请输入分析周期' },
  { prop: 'key_indicator', label: '关键指标', type: 'input', placeholder: '请输入关键指标' }
]

const tableColumns = [
  { prop: 'data_source', label: '数据来源', width: '150' },
  { prop: 'data_type', label: '数据类型', width: '150' },
  { 
    prop: 'collection_time', 
    label: '采集时间', 
    width: '140',
    formatter: (row) => formatDateTime(row.collection_time)
  },
  { prop: 'data_description', label: '数据描述', showOverflowTooltip: true },
  { prop: 'analysis_method', label: '分析方法', width: '120' },
  { prop: 'analyst', label: '分析师', width: '120' },
  { prop: 'analysis_period', label: '分析周期', width: '120' },
  { prop: 'key_indicator', label: '关键指标', width: '150' },
  { prop: 'indicator_value', label: '指标值', width: '120' },
  { prop: 'analysis_result', label: '分析结果', showOverflowTooltip: true }
]

const formFields = [
  { 
    prop: 'file_id', 
    label: '文件上传', 
    type: 'file', 
    required: true
  },
  { 
    prop: 'data_source', 
    label: '数据来源', 
    type: 'input', 
    placeholder: '请输入数据来源',
    required: true
  },
  { 
    prop: 'data_type', 
    label: '数据类型', 
    type: 'input', 
    placeholder: '请输入数据类型',
    required: true
  },
  { 
    prop: 'collection_time', 
    label: '采集时间', 
    type: 'date', 
    placeholder: '请选择采集时间',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD',
    required: true
  },
  { 
    prop: 'data_description', 
    label: '数据描述', 
    type: 'textarea', 
    placeholder: '请输入数据描述',
    rows: 3
  },
  { 
    prop: 'analysis_method', 
    label: '分析方法', 
    type: 'input', 
    placeholder: '请输入分析方法'
  },
  { 
    prop: 'analyst', 
    label: '分析师', 
    type: 'input', 
    placeholder: '请输入分析师'
  },
  { 
    prop: 'analysis_period', 
    label: '分析周期', 
    type: 'input', 
    placeholder: '请输入分析周期'
  },
  { 
    prop: 'key_indicator', 
    label: '关键指标', 
    type: 'input', 
    placeholder: '请输入关键指标'
  },
  { 
    prop: 'indicator_value', 
    label: '指标值', 
    type: 'number', 
    precision: 4,
    placeholder: '请输入指标值'
  },
  { 
    prop: 'analysis_result', 
    label: '分析结果', 
    type: 'textarea', 
    placeholder: '请输入分析结果',
    rows: 3
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
  const formData = { analysis_id: '' }
  formFields.forEach(field => {
    if (field.type === 'number') {
      formData[field.prop] = 0
    } else {
      formData[field.prop] = ''
    }
  })
  return formData
}

// ==================== 辅助函数 ====================

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return datetime.split(' ')[0]
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
const currentFileInfo = ref(null)

const showAdvancedSearch = ref(false)
const searchParams = ref({})
const showExportDialog = ref(false)

const exportColumns = [
  { prop: 'data_source', label: '数据来源' },
  { prop: 'data_type', label: '数据类型' },
  { prop: 'collection_time', label: '采集时间', formatter: (row) => row.collection_time || '-' },
  { prop: 'data_description', label: '数据描述' },
  { prop: 'analysis_method', label: '分析方法' },
  { prop: 'analyst', label: '分析师' },
  { prop: 'analysis_period', label: '分析周期' },
  { prop: 'key_indicator', label: '关键指标' },
  { prop: 'indicator_value', label: '指标值' },
  { prop: 'analysis_result', label: '分析结果' }
]

const fetchExportData = async (page, size) => {
  const params = {
    page,
    size,
    ...searchParams.value
  }
  const res = await dataAnalysisApi.dataAnalysisList(params)
  if (res.success) {
    return res.data?.records || []
  }
  return []
}

const rules = computed(() => {
  const rulesObj = {}
  formFields.forEach(field => {
    if (field.required) {
      if (field.prop === 'file_id') {
        rulesObj[field.prop] = [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (!isEdit.value && !value) {
                callback(new Error('请上传文件'))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      } else {
        rulesObj[field.prop] = [{ required: true, message: `请输入${field.label}`, trigger: field.type === 'select' ? 'change' : 'blur' }]
      }
    }
  })
  return rulesObj
})

// ==================== API 调用 ====================

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      ...searchParams.value
    }
    const res = await dataAnalysisApi.dataAnalysisList(params)
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
  currentFileInfo.value = null
  form.value = getInitialFormData()
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  isEdit.value = true
  form.value = { ...row }
  if (row.file_id) {
    await loadFileInfo(row.file_id)
  } else {
    currentFileInfo.value = null
  }
  dialogVisible.value = true
}

const handleFileChange = (file) => {
  currentFileInfo.value = file
}

const loadFileInfo = async (fileId) => {
  try {
    const res = await fileApi.fileUrlsGen({ files_id: [fileId] })
    if (res.success && res.data && res.data.length > 0) {
      currentFileInfo.value = res.data[0]
    } else {
      currentFileInfo.value = null
    }
  } catch (error) {
    console.error('加载文件信息失败:', error)
    currentFileInfo.value = null
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        if (isEdit.value) {
          res = await dataAnalysisApi.dataAnalysisModify(form.value)
        } else {
          res = await dataAnalysisApi.dataAnalysisSubmit(form.value)
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
    `确定要删除分析数据吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await dataAnalysisApi.dataAnalysisDelete({ analysis_id: row.analysis_id })
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
.data-analysis {
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
