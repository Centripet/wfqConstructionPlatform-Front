<template>
  <div class="material-allocation">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加调配
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
      :title="isEdit ? '编辑调配' : '添加调配'"
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
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="form[field.prop]" 
            :min="field.min || 0" 
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
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    
    <AdvancedSearch
      v-model:visible="showAdvancedSearch"
      title="物资调配高级搜索"
      :search-fields="getSearchFieldsWithOptions()"
      @search="handleSearch"
    />
    
    <ExportDialog
      v-model:visible="showExportDialog"
      :total="total"
      :page-size="pageSize"
      :columns="exportColumns"
      :fetch-page-data="fetchExportData"
      default-filename="物资调配"
      @close="showExportDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, Download } from '@element-plus/icons-vue'
import { materialAllocationApi } from '@/api/materialAllocation'
import { projectApi } from '@/api/project'
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import ExportDialog from '@/components/ExportDialog.vue'

// ==================== 配置常量区域 ====================

const searchFields = [
  { prop: 'material_name', label: '物资名称', type: 'input', placeholder: '请输入物资名称' },
  { prop: 'material_specification', label: '规格型号', type: 'input', placeholder: '请输入规格型号' },
  { prop: 'transfer_out_project_id', label: '调出项目', type: 'select', placeholder: '请选择调出项目', optionsKey: 'projectList', optionLabel: 'project_name', optionValue: 'project_id' },
  { prop: 'transfer_in_project_id', label: '调入项目', type: 'select', placeholder: '请选择调入项目', optionsKey: 'projectList', optionLabel: 'project_name', optionValue: 'project_id' },
  { prop: 'allocation_responsible', label: '负责人', type: 'input', placeholder: '请输入负责人' },
  { prop: 'allocation_time', label: '调配时间', type: 'date', placeholder: '请选择调配时间' }
]

const tableColumns = [
  { prop: 'material_name', label: '物资名称', width: '150' },
  { prop: 'material_specification', label: '规格型号', width: '120' },
  { 
    prop: 'transfer_out_project_id', 
    label: '调出项目', 
    width: '180',
    formatter: (row, projectList) => getProjectName(row.transfer_out_project_id, projectList)
  },
  { 
    prop: 'transfer_in_project_id', 
    label: '调入项目', 
    width: '180',
    formatter: (row, projectList) => getProjectName(row.transfer_in_project_id, projectList)
  },
  { prop: 'allocation_number', label: '调配数量', width: '100' },
  { prop: 'allocation_unit', label: '单位', width: '80' },
  { 
    prop: 'allocation_time', 
    label: '调配时间', 
    width: '120',
    formatter: (row) => row.allocation_time || '-'
  },
  { prop: 'allocation_responsible', label: '负责人', width: '120' },
  { prop: 'remarks', label: '备注', showOverflowTooltip: true }
]

const formFields = [
  { 
    prop: 'material_name', 
    label: '物资名称', 
    type: 'input', 
    placeholder: '请输入物资名称',
    required: true
  },
  { 
    prop: 'material_specification', 
    label: '规格型号', 
    type: 'input', 
    placeholder: '请输入规格型号'
  },
  { 
    prop: 'transfer_out_project_id', 
    label: '调出项目', 
    type: 'select', 
    placeholder: '请选择调出项目',
    optionsKey: 'projectList',
    optionLabel: 'project_name',
    optionValue: 'project_id',
    required: true
  },
  { 
    prop: 'transfer_in_project_id', 
    label: '调入项目', 
    type: 'select', 
    placeholder: '请选择调入项目',
    optionsKey: 'projectList',
    optionLabel: 'project_name',
    optionValue: 'project_id',
    required: true
  },
  { 
    prop: 'allocation_number', 
    label: '调配数量', 
    type: 'number', 
    min: 1,
    placeholder: '请输入调配数量'
  },
  { 
    prop: 'allocation_unit', 
    label: '单位', 
    type: 'input', 
    placeholder: '请输入单位'
  },
  { 
    prop: 'allocation_time', 
    label: '调配时间', 
    type: 'date', 
    placeholder: '请选择调配时间',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD',
    required: true
  },
  { 
    prop: 'allocation_responsible', 
    label: '负责人', 
    type: 'input', 
    placeholder: '请输入负责人',
    required: true
  },
  { 
    prop: 'remarks', 
    label: '备注', 
    type: 'textarea', 
    placeholder: '请输入备注',
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
  const formData = { material_id: '' }
  formFields.forEach(field => {
    if (field.type === 'number') {
      formData[field.prop] = field.min || 0
    } else if (field.type === 'select') {
      formData[field.prop] = ''
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
  { prop: 'material_name', label: '物资名称' },
  { prop: 'material_specification', label: '规格型号' },
  { prop: 'transfer_out_project_id', label: '调出项目', formatter: (row) => getProjectName(row.transfer_out_project_id, projectList.value) },
  { prop: 'transfer_in_project_id', label: '调入项目', formatter: (row) => getProjectName(row.transfer_in_project_id, projectList.value) },
  { prop: 'allocation_number', label: '调配数量' },
  { prop: 'allocation_unit', label: '单位' },
  { prop: 'allocation_time', label: '调配时间', formatter: (row) => row.allocation_time || '-' },
  { prop: 'allocation_responsible', label: '负责人' },
  { prop: 'remarks', label: '备注' }
]

const fetchExportData = async (page, size) => {
  const params = {
    page,
    size,
    ...searchParams.value
  }
  const res = await materialAllocationApi.materialAllocationList(params)
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
    const res = await materialAllocationApi.materialAllocationList(params)
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
          res = await materialAllocationApi.materialAllocationModify(form.value)
        } else {
          res = await materialAllocationApi.materialAllocationSubmit(form.value)
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
    `确定要删除调配 "${row.material_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await materialAllocationApi.materialAllocationDelete({ material_id: row.material_id })
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
.material-allocation {
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
</style>
