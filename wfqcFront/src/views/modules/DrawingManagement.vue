<template>
  <div class="drawing-management">
    <div class="search-bar">
      <el-select v-model="selectedProjectId" placeholder="请选择项目" clearable @change="loadData">
        <el-option
          v-for="proj in projectList"
          :key="proj.project_id"
          :label="proj.project_name"
          :value="proj.project_id"
        />
      </el-select>
    </div>
    
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加图纸
      </el-button>
      <el-button @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
    
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
    
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
      style="margin-top: 20px; justify-content: flex-end; display: flex;"
    />
    
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑图纸' : '添加图纸'"
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
            :file-type="2"
            @change="handleFileChange"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { drawingApi } from '@/api/drawing'
import { projectApi } from '@/api/project'
import { fileApi } from '@/api/file'
import SingleFileUploader from '@/components/SingleFileUploader.vue'

// ==================== 配置常量区域 ====================

const tableColumns = [
  { 
    prop: 'project_id', 
    label: '所属项目', 
    width: '150',
    formatter: (row, projectList) => getProjectName(row.project_id, projectList)
  },
  { prop: 'drawing_name', label: '图纸名称', width: '180' },
  { prop: 'drawing_no', label: '图纸编号', width: '150' },
  { prop: 'drawing_type', label: '图纸类型', width: '120' },
  { prop: 'version', label: '版本', width: '100' },
  { prop: 'auditor', label: '审核人', width: '120' },
  { 
    prop: 'audit_date', 
    label: '审核日期', 
    width: '120',
    formatter: (row) => row.audit_date || '-'
  },
  { prop: 'remarks', label: '备注', showOverflowTooltip: true }
]

const formFields = [
  { 
    prop: 'file_id', 
    label: '图纸文件', 
    type: 'file', 
    required: true
  },
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
    prop: 'drawing_name', 
    label: '图纸名称', 
    type: 'input', 
    placeholder: '请输入图纸名称',
    required: true
  },
  { 
    prop: 'drawing_no', 
    label: '图纸编号', 
    type: 'input', 
    placeholder: '请输入图纸编号'
  },
  { 
    prop: 'drawing_type', 
    label: '图纸类型', 
    type: 'input', 
    placeholder: '请输入图纸类型'
  },
  { 
    prop: 'version', 
    label: '版本', 
    type: 'input', 
    placeholder: '请输入版本'
  },
  { 
    prop: 'auditor', 
    label: '审核人', 
    type: 'input', 
    placeholder: '请输入审核人'
  },
  { 
    prop: 'audit_date', 
    label: '审核日期', 
    type: 'date', 
    placeholder: '请选择审核日期',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD'
  },
  { 
    prop: 'remarks', 
    label: '备注', 
    type: 'textarea', 
    placeholder: '请输入备注',
    rows: 3
  }
]



const getInitialFormData = () => {
  const formData = { drawing_id: '' }
  formFields.forEach(field => {
    if (field.type === 'number') {
      formData[field.prop] = field.min || 0
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
const selectedProjectId = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref(getInitialFormData())
const currentFileInfo = ref(null)

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
                callback(new Error('请上传图纸文件'))
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
      size: pageSize.value
    }
    if (selectedProjectId.value) {
      params.project_id = selectedProjectId.value
    }
    const res = await drawingApi.drawingList(params)
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

const handleAdd = () => {
  isEdit.value = false
  currentFileInfo.value = null
  const initialForm = getInitialFormData()
  form.value = { ...initialForm, project_id: selectedProjectId.value || '' }
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
          res = await drawingApi.drawingModify(form.value)
        } else {
          res = await drawingApi.drawingSubmit(form.value)
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
    `确定要删除图纸 "${row.drawing_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await drawingApi.drawingDelete({ drawing_id: row.drawing_id })
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
.drawing-management {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
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
}
</style>
