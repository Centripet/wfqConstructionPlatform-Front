<template>
  <div class="collaboration">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加协同
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
      :title="isEdit ? '编辑协同' : '添加协同'"
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
      title="协作交流高级搜索"
      :search-fields="getSearchFieldsWithOptions()"
      @search="handleSearch"
    />
    
    <ExportDialog
      v-model:visible="showExportDialog"
      :total="total"
      :page-size="pageSize"
      :columns="exportColumns"
      :fetch-page-data="fetchExportData"
      default-filename="协作交流"
      @close="showExportDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Download } from '@element-plus/icons-vue'
import { cooperationApi } from '@/api/cooperation'
import { projectApi } from '@/api/project'
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import ExportDialog from '@/components/ExportDialog.vue'

// ==================== 配置常量区域 ====================

const IS_SOLVED_CONFIG = {
  true: { label: '已解决', type: 'success' },
  false: { label: '未解决', type: 'info' }
}

const isSolvedOptions = [
  { value: true, label: '是' },
  { value: false, label: '否' }
]

const searchFields = [
  { prop: 'project_id', label: '所属项目', type: 'select', placeholder: '请选择项目', optionsKey: 'projectList', optionLabel: 'project_name', optionValue: 'project_id' },
  { prop: 'topic', label: '主题', type: 'input', placeholder: '请输入主题' },
  { prop: 'initiator', label: '发起人', type: 'input', placeholder: '请输入发起人' },
  { prop: 'participants', label: '参与人员', type: 'input', placeholder: '请输入参与人员' },
  { prop: 'communication_time', label: '沟通时间', type: 'date', placeholder: '请选择沟通时间' },
  { prop: 'communication_method', label: '沟通方式', type: 'input', placeholder: '请输入沟通方式' },
  { prop: 'is_solved', label: '是否解决', type: 'select', placeholder: '请选择是否解决', options: isSolvedOptions },
  { prop: 'follow_up_person', label: '跟进人', type: 'input', placeholder: '请输入跟进人' }
]

const tableColumns = [
  { 
    prop: 'project_id', 
    label: '所属项目', 
    width: '150',
    formatter: (row, projectList) => getProjectName(row.project_id, projectList)
  },
  { prop: 'topic', label: '主题', width: '180' },
  { prop: 'initiator', label: '发起人', width: '120' },
  { prop: 'participants', label: '参与人员', showOverflowTooltip: true },
  { 
    prop: 'communication_time', 
    label: '沟通时间', 
    width: '140',
    formatter: (row) => row.communication_time || '-'
  },
  { prop: 'communication_method', label: '沟通方式', width: '120' },
  { prop: 'content_summary', label: '内容摘要', showOverflowTooltip: true },
  { 
    prop: 'is_solved', 
    label: '是否解决', 
    width: '100',
    tagType: (val) => IS_SOLVED_CONFIG[val]?.type || 'info',
    formatter: (row) => IS_SOLVED_CONFIG[row.is_solved]?.label || '未知'
  },
  { prop: 'follow_up_person', label: '跟进人', width: '120' }
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
    prop: 'topic', 
    label: '主题', 
    type: 'input', 
    placeholder: '请输入主题',
    required: true
  },
  { 
    prop: 'initiator', 
    label: '发起人', 
    type: 'input', 
    placeholder: '请输入发起人',
    required: true
  },
  { 
    prop: 'participants', 
    label: '参与人员', 
    type: 'input', 
    placeholder: '请输入参与人员'
  },
  { 
    prop: 'communication_time', 
    label: '沟通时间', 
    type: 'date', 
    placeholder: '请选择沟通时间',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD',
    required: true
  },
  { 
    prop: 'communication_method', 
    label: '沟通方式', 
    type: 'input', 
    placeholder: '请输入沟通方式'
  },
  { 
    prop: 'content_summary', 
    label: '内容摘要', 
    type: 'textarea', 
    placeholder: '请输入内容摘要',
    rows: 3
  },
  { 
    prop: 'is_solved', 
    label: '是否解决', 
    type: 'select', 
    placeholder: '请选择',
    options: isSolvedOptions
  },
  { 
    prop: 'follow_up_person', 
    label: '跟进人', 
    type: 'input', 
    placeholder: '请输入跟进人'
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
  const formData = { coop_id: '' }
  formFields.forEach(field => {
    if (field.type === 'number') {
      formData[field.prop] = field.min || 0
    } else if (field.type === 'select') {
      formData[field.prop] = field.options ? field.options[1]?.value : ''
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
  { prop: 'topic', label: '主题' },
  { prop: 'initiator', label: '发起人' },
  { prop: 'participants', label: '参与人员' },
  { prop: 'communication_time', label: '沟通时间', formatter: (row) => row.communication_time || '-' },
  { prop: 'communication_method', label: '沟通方式' },
  { prop: 'content_summary', label: '内容摘要' },
  { prop: 'is_solved', label: '是否解决', formatter: (row) => IS_SOLVED_CONFIG[row.is_solved]?.label || '未知' },
  { prop: 'follow_up_person', label: '跟进人' }
]

const fetchExportData = async (page, size) => {
  const params = {
    page,
    size,
    ...searchParams.value
  }
  const res = await cooperationApi.cooperationList(params)
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
    const res = await cooperationApi.cooperationList(params)
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
          res = await cooperationApi.cooperationModify(form.value)
        } else {
          res = await cooperationApi.cooperationSubmit(form.value)
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
    `确定要删除协同 "${row.topic}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await cooperationApi.cooperationDelete({ coop_id: row.coop_id })
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
.collaboration {
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
